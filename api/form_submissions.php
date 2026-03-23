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

if ($method === 'GET') {
    $pageId = isset($_GET['page_id']) ? intval($_GET['page_id']) : 0;

    if ($pageId <= 0) {
        echo json_encode(["status" => "error", "message" => "page_id tidak valid."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, page_id, data, DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS created_at FROM form_submissions WHERE page_id = ? ORDER BY id DESC");
    $stmt->execute([$pageId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($row) {
        $decoded = json_decode($row['data'], true);
        $row['data'] = $decoded ? $decoded : [];
        return $row;
    }, $rows);

    echo json_encode(["status" => "success", "data" => $formatted]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $pageId = isset($data['page_id']) ? intval($data['page_id']) : 0;
    $fields = isset($data['data']) && is_array($data['data']) ? $data['data'] : [];

    if ($pageId <= 0 || empty($fields)) {
        echo json_encode(["status" => "error", "message" => "Data form tidak valid."]);
        exit;
    }

    $cleanFields = sanitize_value($fields);
    $payload = json_encode($cleanFields, JSON_UNESCAPED_UNICODE);

    $stmt = $conn->prepare("INSERT INTO form_submissions (page_id, data) VALUES (?, ?)");
    if ($stmt->execute([$pageId, $payload])) {
        echo json_encode(["status" => "success", "message" => "Data berhasil dikirim."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal menyimpan data."]);
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

    $stmt = $conn->prepare("DELETE FROM form_submissions WHERE id = ?");
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

