<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__ . '/auth_middleware.php';

if ($method !== 'GET') {
    require_write_access(['Admin', 'Editor']);
}

function sanitize_text($str) {
    return htmlspecialchars(trim((string)$str), ENT_QUOTES, 'UTF-8');
}

function sanitize_slug($str) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', (string)$str)));
    return trim($slug, '-');
}

function sanitize_field_name($str) {
    $name = strtolower(trim(preg_replace('/[^A-Za-z0-9_]+/', '_', (string)$str)));
    return trim($name, '_');
}

function sanitize_display_type($value) {
    $allowed = ['table', 'card', 'grid', 'list'];
    return in_array($value, $allowed, true) ? $value : 'table';
}

function sanitize_sort_direction($value) {
    return $value === 'desc' ? 'desc' : 'asc';
}

function sanitize_grid_columns($value) {
    $val = intval($value);
    if (!in_array($val, [2, 3, 4], true)) return 3;
    return $val;
}

if ($method === 'GET') {
    $stmt = $conn->query("SELECT id, title, slug, display_type, grid_columns, sort_field, sort_direction, DATE_FORMAT(created_at, '%d/%m/%Y') AS date FROM data_modules ORDER BY id DESC");
    $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $fieldsStmt = $conn->query("SELECT id, module_id, label, name, type, required, options, order_index FROM data_module_fields ORDER BY order_index ASC, id ASC");
    $fields = $fieldsStmt->fetchAll(PDO::FETCH_ASSOC);

    $fieldsByModule = [];
    foreach ($fields as $field) {
        $field['required'] = (bool)$field['required'];
        $fieldsByModule[$field['module_id']][] = $field;
    }

    $data = array_map(function($module) use ($fieldsByModule) {
        $module['fields'] = $fieldsByModule[$module['id']] ?? [];
        return $module;
    }, $modules);

    echo json_encode(["status" => "success", "data" => $data]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    $title = sanitize_text($data->title ?? '');
    if ($title === '') {
        echo json_encode(["status" => "error", "message" => "Judul module wajib diisi."]);
        exit;
    }

    $slug = !empty($data->slug) ? sanitize_slug($data->slug) : sanitize_slug($title);
    if ($slug === '') {
        echo json_encode(["status" => "error", "message" => "Slug module tidak valid."]);
        exit;
    }

    $displayType = sanitize_display_type($data->display_type ?? 'table');
    $gridColumns = sanitize_grid_columns($data->grid_columns ?? 3);
    $sortField = !empty($data->sort_field) ? sanitize_field_name($data->sort_field) : null;
    if ($sortField === '') $sortField = null;
    $sortDirection = sanitize_sort_direction($data->sort_direction ?? 'asc');
    $fields = isset($data->fields) && is_array($data->fields) ? $data->fields : [];

    if (!empty($data->id)) {
        $moduleId = intval($data->id);
        $check = $conn->prepare("SELECT id FROM data_modules WHERE slug = ? AND id != ?");
        $check->execute([$slug, $moduleId]);
        if ($check->rowCount() > 0) {
            $slug = $slug . '-' . time();
        }

        $stmt = $conn->prepare("UPDATE data_modules SET title = ?, slug = ?, display_type = ?, grid_columns = ?, sort_field = ?, sort_direction = ? WHERE id = ?");
        if (!$stmt->execute([$title, $slug, $displayType, $gridColumns, $sortField, $sortDirection, $moduleId])) {
            echo json_encode(["status" => "error", "message" => "Gagal memperbarui module."]);
            exit;
        }

        $conn->prepare("DELETE FROM data_module_fields WHERE module_id = ?")->execute([$moduleId]);
    } else {
        $check = $conn->prepare("SELECT id FROM data_modules WHERE slug = ?");
        $check->execute([$slug]);
        if ($check->rowCount() > 0) {
            $slug = $slug . '-' . time();
        }

        $stmt = $conn->prepare("INSERT INTO data_modules (title, slug, display_type, grid_columns, sort_field, sort_direction) VALUES (?, ?, ?, ?, ?, ?)");
        if (!$stmt->execute([$title, $slug, $displayType, $gridColumns, $sortField, $sortDirection])) {
            echo json_encode(["status" => "error", "message" => "Gagal membuat module."]);
            exit;
        }
        $moduleId = (int)$conn->lastInsertId();
    }

    if (!empty($fields)) {
        $insert = $conn->prepare("INSERT INTO data_module_fields (module_id, label, name, type, required, options, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $order = 0;
        foreach ($fields as $field) {
            $label = sanitize_text($field->label ?? '');
            if ($label === '') continue;
            $name = !empty($field->name) ? sanitize_field_name($field->name) : sanitize_field_name($label);
            $type = sanitize_text($field->type ?? 'text');
            $required = !empty($field->required) ? 1 : 0;
            $options = sanitize_text($field->options ?? '');
            $insert->execute([$moduleId, $label, $name, $type, $required, $options, $order]);
            $order++;
        }
    }

    echo json_encode(["status" => "success", "message" => "Module berhasil disimpan.", "id" => $moduleId, "slug" => $slug]);
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        echo json_encode(["status" => "error", "message" => "ID module tidak valid."]);
        exit;
    }

    $conn->prepare("DELETE FROM data_module_fields WHERE module_id = ?")->execute([$id]);
    $conn->prepare("DELETE FROM data_module_rows WHERE module_id = ?")->execute([$id]);
    $stmt = $conn->prepare("DELETE FROM data_modules WHERE id = ?");
    if ($stmt->execute([$id])) {
        echo json_encode(["status" => "success", "message" => "Module berhasil dihapus."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal menghapus module."]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method tidak diizinkan."]);
?>

