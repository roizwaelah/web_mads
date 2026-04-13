<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_middleware.php';

header("Content-Type: application/json");

// Tangani preflight request dari browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    require_write_access(['Admin', 'Editor']);
}

// Tentukan folder penyimpanan
$upload_dir = "../uploads/documents/";

// Buat folder jika belum ada
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// ==========================================
// HANDLE GET: MENGAMBIL DAFTAR DOKUMEN
// ==========================================
if ($method === 'GET') {
    $sql = "SELECT * FROM documents ORDER BY id DESC";
    $stmt = $conn->query($sql);
    $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

    $documents = [];
    foreach ($rows as $row) {
        $documents[] = [
            "id" => $row['id'],
            "name" => $row['name'],
            "url" => $row['file_path'],
            "type" => $row['type'],
            "created_at" => date('d M Y, H:i', strtotime($row['created_at']))
        ];
    }

    echo json_encode(["status" => "success", "data" => $documents]);
    exit();
}

// ==========================================
// HANDLE POST: MENGUNGGAH DOKUMEN BARU
// ==========================================
if ($method === 'POST') {
    $name = isset($_POST['name']) ? trim($_POST['name']) : 'Dokumen Tanpa Nama';

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["status" => "error", "message" => "File tidak ditemukan atau terjadi kesalahan saat mengunggah."]);
        exit();
    }

    $file = $_FILES['file'];
    $file_name = $file['name'];
    $file_tmp = $file['tmp_name'];
    $file_size = $file['size'];

    $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    $allowed_exts = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

    if (!in_array($file_ext, $allowed_exts, true)) {
        echo json_encode(["status" => "error", "message" => "Ekstensi file tidak diizinkan. Hanya PDF, DOC, dan XLS."]);
        exit();
    }

    if ($file_size > 100 * 1024 * 1024) {
        echo json_encode(["status" => "error", "message" => "Ukuran file terlalu besar. Maksimal 100MB."]);
        exit();
    }

    $new_file_name = uniqid() . "_" . preg_replace("/[^a-zA-Z0-9.-]/", "_", $file_name);
    $target_file = $upload_dir . $new_file_name;

    if (move_uploaded_file($file_tmp, $target_file)) {
        $stmt = $conn->prepare("INSERT INTO documents (name, file_path, type) VALUES (?, ?, ?)");
        if ($stmt && $stmt->execute([$name, $target_file, $file_ext])) {
            echo json_encode(["status" => "success", "message" => "Dokumen berhasil diunggah."]);
        } else {
            if (file_exists($target_file)) {
                unlink($target_file);
            }
            echo json_encode(["status" => "error", "message" => "Gagal menyimpan data ke database."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal memindahkan file ke direktori server."]);
    }
    exit();
}

// ==========================================
// HANDLE DELETE: MENGHAPUS DOKUMEN
// ==========================================
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if ($id <= 0) {
        echo json_encode(["status" => "error", "message" => "ID dokumen tidak valid."]);
        exit();
    }

    $stmt = $conn->prepare("SELECT file_path FROM documents WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $file_path = $row['file_path'];

        if (file_exists($file_path)) {
            unlink($file_path);
        }

        $delete_stmt = $conn->prepare("DELETE FROM documents WHERE id = ?");
        if ($delete_stmt->execute([$id])) {
            echo json_encode(["status" => "success", "message" => "Dokumen berhasil dihapus."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus dokumen dari database."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Dokumen tidak ditemukan."]);
    }
    exit();
}

echo json_encode(["status" => "error", "message" => "Metode request tidak didukung."]);
$conn = null;
?>

