<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__ . '/auth_middleware.php';

if ($method !== 'GET') {
    require_write_access(['Admin', 'Editor']);
}

function sanitize_input($str) {
    return trim(strip_tags($str));
}

if ($method === 'GET') {
    // Alias image_url sebagai img agar rapi di React
    $stmt = $conn->query("SELECT id, name, role, image_url AS img FROM gurus ORDER BY id DESC");
    $gurus = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($gurus as &$g) {
    $g["name"] = html_entity_decode($g["name"], ENT_QUOTES, "UTF-8");
    $g["role"] = html_entity_decode($g["role"], ENT_QUOTES, "UTF-8");
}
    echo json_encode(["status" => "success", "data" => $gurus]);
}

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->name) && !empty($data->role)) {
        $name = sanitize_input($data->name);
        $role = sanitize_input($data->role);
        $img  = sanitize_input($data->img ?? '');
        
        if (!empty($data->id)) {
            $stmt = $conn->prepare("UPDATE gurus SET name = ?, role = ?, image_url = ? WHERE id = ?");
            if ($stmt->execute([$name, $role, $img, $data->id])) {
                echo json_encode(["status" => "success", "message" => "Data guru berhasil diperbarui."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memperbarui data guru."]);
            }
        } else {
            $stmt = $conn->prepare("INSERT INTO gurus (name, role, image_url) VALUES (?, ?, ?)");
            if ($stmt->execute([$name, $role, $img])) {
                echo json_encode(["status" => "success", "message" => "Data guru berhasil ditambahkan."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal menambahkan data guru."]);
            }
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Nama dan Jabatan wajib diisi."]);
    }
}

elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM gurus WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(["status" => "success", "message" => "Data guru berhasil dihapus."]);
        }
    }
}
?>





