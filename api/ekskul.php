<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__ . '/auth_middleware.php';

if ($method !== 'GET') {
    require_write_access(['Admin', 'Editor']);
}

function sanitize_input($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

if ($method === 'GET') {
    $stmt = $conn->query("SELECT id, name, description, image_url AS image, coach, schedule, category, status FROM ekskul ORDER BY id DESC");
    $ekskul = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $ekskul]);
}

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->name)) {
        $name     = sanitize_input($data->name);
        $desc     = sanitize_input($data->description ?? '');
        $imageRaw = $data->image ?? $data->img ?? '';
        $image    = sanitize_input($imageRaw);
        $coach    = sanitize_input($data->coach ?? '');
        $schedule = sanitize_input($data->schedule ?? '');
        $category = sanitize_input($data->category ?? '');
        $status   = in_array($data->status, ['Draft', 'Publish']) ? $data->status : 'Draft';
        
        if (!empty($data->id)) {
            $stmt = $conn->prepare("UPDATE ekskul SET name = ?, description = ?, image_url = ?, coach = ?, schedule = ?, category = ?, status = ? WHERE id = ?");
            if ($stmt->execute([$name, $desc, $image, $coach, $schedule, $category, $status, $data->id])) {
                echo json_encode(["status" => "success", "message" => "Ekskul berhasil diperbarui."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memperbarui ekskul."]);
            }
        } else {
            $stmt = $conn->prepare("INSERT INTO ekskul (name, description, image_url, coach, schedule, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            if ($stmt->execute([$name, $desc, $image, $coach, $schedule, $category, $status])) {
                echo json_encode(["status" => "success", "message" => "Ekskul berhasil ditambahkan."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal menambahkan ekskul."]);
            }
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Nama ekskul wajib diisi."]);
    }
}

elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM ekskul WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(["status" => "success", "message" => "Ekskul berhasil dihapus."]);
        }
    }
}
?>



