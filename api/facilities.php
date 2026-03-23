<?php
header("Content-Type: application/json");

require_once __DIR__ . '/config.php';

// Tangani preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__ . '/auth_middleware.php';

if ($method !== 'GET') {
    require_write_access(['Admin', 'Editor']);
}

try {
    if ($method === 'GET') {
        // Mengambil semua fasilitas
        $stmt = $conn->query("SELECT * FROM facilities ORDER BY id DESC");
        $data = $stmt->fetchAll();
        echo json_encode(["status" => "success", "data" => $data]);
    } 

    elseif ($method === 'POST') {
        // Menambah fasilitas baru
        $input = json_decode(file_get_contents("php://input"), true);
        
        $sql = "INSERT INTO facilities (name, description, image) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $input['name'], 
            $input['description'], 
            $input['image']
        ]);
        
        echo json_encode(["status" => "success", "message" => "Fasilitas berhasil ditambah"]);
    }

    elseif ($method === 'PUT') {
        // Memperbarui fasilitas yang ada
        $input = json_decode(file_get_contents("php://input"), true);
        
        $sql = "UPDATE facilities SET name = ?, description = ?, image = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            $input['name'], 
            $input['description'], 
            $input['image'], 
            $input['id']
        ]);
        
        echo json_encode(["status" => "success", "message" => "Fasilitas berhasil diperbarui"]);
    }

    elseif ($method === 'DELETE') {
        // Menghapus fasilitas
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if ($id > 0) {
            $stmt = $conn->prepare("DELETE FROM facilities WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Fasilitas berhasil dihapus"]);
        } else {
            echo json_encode(["status" => "error", "message" => "ID tidak valid"]);
        }
    }
} catch (\PDOException $e) {
    // Tangani error database
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}



