<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__ . '/auth_middleware.php';

function sanitize_value($value) {
    if (is_array($value)) {
        return array_map('sanitize_value', $value);
    }
    return htmlspecialchars(trim((string)$value), ENT_QUOTES, 'UTF-8');
}

function sanitize_field_name($str) {
    $name = strtolower(trim(preg_replace('/[^A-Za-z0-9_]+/', '_', (string)$str)));
    return trim($name, '_');
}

function sanitize_sort_direction($value) {
    return $value === 'desc' ? 'desc' : 'asc';
}

if ($method === 'GET') {
    $moduleId = isset($_GET['module_id']) ? intval($_GET['module_id']) : 0;
    if ($moduleId <= 0) {
        echo json_encode(["status" => "error", "message" => "module_id tidak valid."]);
        exit;
    }

    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
    $sortField = isset($_GET['sort_field']) ? sanitize_field_name($_GET['sort_field']) : '';
    $sortDirection = sanitize_sort_direction($_GET['sort_direction'] ?? 'asc');
    $sortType = isset($_GET['sort_type']) ? $_GET['sort_type'] : '';

    $stmt = $conn->prepare("SELECT id, module_id, data, DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at, UNIX_TIMESTAMP(created_at) AS created_ts FROM data_module_rows WHERE module_id = ? ORDER BY id DESC");
    $stmt->execute([$moduleId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($row) {
        $decoded = json_decode($row['data'], true);
        $row['data'] = $decoded ? $decoded : [];
        return $row;
    }, $rows);

    if (!empty($sortField)) {
        usort($formatted, function($a, $b) use ($sortField, $sortDirection, $sortType) {
            $dir = $sortDirection === 'desc' ? -1 : 1;
            if ($sortField === 'created_at') {
                $aVal = $a['created_ts'] ?? 0;
                $bVal = $b['created_ts'] ?? 0;
                if ($aVal == $bVal) return 0;
                return ($aVal > $bVal ? 1 : -1) * $dir;
            }

            $aVal = $a['data'][$sortField] ?? '';
            $bVal = $b['data'][$sortField] ?? '';

            if ($sortType === 'number') {
                $aNum = is_numeric($aVal) ? floatval($aVal) : 0;
                $bNum = is_numeric($bVal) ? floatval($bVal) : 0;
                if ($aNum == $bNum) return 0;
                return ($aNum > $bNum ? 1 : -1) * $dir;
            }

            if ($sortType === 'date') {
                $aTime = strtotime((string)$aVal) ?: 0;
                $bTime = strtotime((string)$bVal) ?: 0;
                if ($aTime == $bTime) return 0;
                return ($aTime > $bTime ? 1 : -1) * $dir;
            }

            $aStr = strtolower((string)$aVal);
            $bStr = strtolower((string)$bVal);
            if ($aStr == $bStr) return 0;
            return ($aStr > $bStr ? 1 : -1) * $dir;
        });
    }

    $total = count($formatted);
    $offset = ($page - 1) * $limit;
    $paged = array_slice($formatted, $offset, $limit);

    echo json_encode([
        "status" => "success",
        "data" => $paged,
        "total" => $total,
        "page" => $page,
        "limit" => $limit,
    ]);
    exit;
}

if ($method === 'POST') {
    require_write_access(['Admin', 'Editor']);

    $data = json_decode(file_get_contents("php://input"), true);
    $moduleId = isset($data['module_id']) ? intval($data['module_id']) : 0;
    $fields = isset($data['data']) && is_array($data['data']) ? $data['data'] : [];

    if ($moduleId <= 0 || empty($fields)) {
        echo json_encode(["status" => "error", "message" => "Data tidak valid."]);
        exit;
    }

    $cleanFields = sanitize_value($fields);
    $payload = json_encode($cleanFields, JSON_UNESCAPED_UNICODE);

    if (!empty($data['id'])) {
        $id = intval($data['id']);
        $stmt = $conn->prepare("UPDATE data_module_rows SET data = ? WHERE id = ? AND module_id = ?");
        if ($stmt->execute([$payload, $id, $moduleId])) {
            echo json_encode(["status" => "success", "message" => "Data berhasil diperbarui."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal memperbarui data."]);
        }
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO data_module_rows (module_id, data) VALUES (?, ?)");
    if ($stmt->execute([$moduleId, $payload])) {
        echo json_encode(["status" => "success", "message" => "Data berhasil ditambahkan."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal menambahkan data."]);
    }
    exit;
}

if ($method === 'DELETE') {
    require_write_access(['Admin', 'Editor']);

    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        echo json_encode(["status" => "error", "message" => "ID tidak valid."]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM data_module_rows WHERE id = ?");
    if ($stmt->execute([$id])) {
        echo json_encode(["status" => "success", "message" => "Data berhasil dihapus."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal menghapus data."]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method tidak diizinkan."]);
?>

