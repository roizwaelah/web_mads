<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__ . '/auth_middleware.php';

if ($method !== 'GET') {
    require_write_access(['Admin', 'Editor']);
}

// ==========================================
// FUNGSI NORMALISASI & SANITASI
// ==========================================

function sanitize_title($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

function sanitize_content($html) {
    if (empty($html)) return '';
    $html = str_replace(['&nbsp;', '&#160;', '&amp;nbsp;'], ' ', $html);
    $html = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $html);
    $html = preg_replace('#<iframe(.*?)>(.*?)</iframe>#is', '', $html);
    $html = preg_replace('#<style(.*?)>(.*?)</style>#is', '', $html);
    $html = preg_replace('#<object(.*?)>(.*?)</object>#is', '', $html);
    $html = preg_replace('#\s*on[a-z]+\s*=\s*(["\']).*?\1#is', '', $html);
    return trim($html);
}

// Fungsi baru untuk validasi URL gambar
function sanitize_image($url) {
    if (empty($url)) return '';
    return filter_var(trim($url), FILTER_SANITIZE_URL);
}

// ==========================================
// ROUTING API
// ==========================================

// 1. MENGAMBIL DATA POS (GET)
if ($method === 'GET') {
    // Menambahkan kolom 'image' dalam query
    $stmt = $conn->query("SELECT id, title, content, image, author, category, status, DATE_FORMAT(created_at, '%d/%m/%Y') AS date FROM posts ORDER BY id DESC");
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["status" => "success", "data" => $posts]);
}

// 2. MENYIMPAN ATAU MEMPERBARUI POS (POST)
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->title) && !empty($data->content)) {
        
        // TERAPKAN SANITASI
        $clean_title   = sanitize_title($data->title);
        $clean_content = sanitize_content($data->content);
        $clean_image   = sanitize_image($data->image ?? ''); // Menangkap data gambar
        $clean_author  = sanitize_title($data->author ?? 'Admin');
        $clean_cat     = sanitize_title($data->category ?? 'Berita Utama');
        $status        = in_array($data->status, ['Draft', 'Publish']) ? $data->status : 'Draft';
        
        // Mode UPDATE (Sunting)
        if (!empty($data->id)) {
            $stmt = $conn->prepare("UPDATE posts SET title = ?, content = ?, image = ?, author = ?, category = ?, status = ? WHERE id = ?");
            $params = [$clean_title, $clean_content, $clean_image, $clean_author, $clean_cat, $status, $data->id];
            
            if ($stmt->execute($params)) {
                echo json_encode(["status" => "success", "message" => "Pos berhasil diperbarui."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memperbarui pos."]);
            }
        } 
        // Mode INSERT (Tambah Baru)
        else {
            $stmt = $conn->prepare("INSERT INTO posts (title, content, image, author, category, status) VALUES (?, ?, ?, ?, ?, ?)");
            $params = [$clean_title, $clean_content, $clean_image, $clean_author, $clean_cat, $status];
            
            if ($stmt->execute($params)) {
                echo json_encode(["status" => "success", "message" => "Pos berhasil diterbitkan."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal menerbitkan pos."]);
            }
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Judul dan konten wajib diisi."]);
    }
}

// 3. MENGHAPUS POS (DELETE)
elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM posts WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(["status" => "success", "message" => "Pos berhasil dihapus."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus pos."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "ID pos tidak valid."]);
    }
}
?>


