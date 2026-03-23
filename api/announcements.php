<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];

function create_slug($string) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', (string)$string)));
    return trim($slug, '-');
}
require_once __DIR__ . '/auth_middleware.php';

if ($method !== 'GET') {
    require_write_access(['Admin', 'Editor']);
}

function sanitize_input($str) {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

function sanitize_html($html) {
    if (empty($html)) return '';
    $html = str_replace(['&nbsp;', '&#160;', '&amp;nbsp;'], ' ', $html);
    $html = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $html);
    $html = preg_replace('#<iframe(.*?)>(.*?)</iframe>#is', '', $html);
    $html = preg_replace('#\s*on[a-z]+\s*=\s*(["\']).*?\1#is', '', $html);
    return trim($html);
}

// GET
if ($method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $slug = isset($_GET['slug']) ? create_slug($_GET['slug']) : '';
    $stmt = $conn->query("SELECT id, title, content, author, status, DATE_FORMAT(created_at, '%d/%m/%Y') AS date FROM announcements ORDER BY id DESC");
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $announcements = array_map(function ($item) {
        $item['slug'] = create_slug($item['title'] ?? '');
        return $item;
    }, $announcements);
    if ($id > 0 || $slug !== '') {
        $filtered = array_values(array_filter($announcements, function ($item) use ($id, $slug) {
            if ($id > 0 && intval($item['id']) === $id) return true;
            if ($slug !== '' && ($item['slug'] ?? '') === $slug) return true;
            return false;
        }));
        echo json_encode(["status" => "success", "data" => $filtered ? $filtered[0] : null]);
        return;
    }
    echo json_encode(["status" => "success", "data" => $announcements]);
}

// POST (Create & Update)
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->title) && !empty($data->content)) {
        $clean_title   = sanitize_input($data->title);
        $clean_content = sanitize_html($data->content);
        $clean_author  = sanitize_input($data->author ?? 'Admin');
        $status        = in_array($data->status, ['Draft', 'Publish']) ? $data->status : 'Draft';
        
        if (!empty($data->id)) {
            $stmt = $conn->prepare("UPDATE announcements SET title = ?, content = ?, author = ?, status = ? WHERE id = ?");
            if ($stmt->execute([$clean_title, $clean_content, $clean_author, $status, $data->id])) {
                echo json_encode(["status" => "success", "message" => "Pengumuman berhasil diperbarui."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memperbarui pengumuman."]);
            }
        } else {
            $stmt = $conn->prepare("INSERT INTO announcements (title, content, author, status) VALUES (?, ?, ?, ?)");
            if ($stmt->execute([$clean_title, $clean_content, $clean_author, $status])) {
                echo json_encode(["status" => "success", "message" => "Pengumuman berhasil diterbitkan."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal menerbitkan pengumuman."]);
            }
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Judul dan konten wajib diisi."]);
    }
}

// DELETE
elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM announcements WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(["status" => "success", "message" => "Pengumuman berhasil dihapus."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus pengumuman."]);
        }
    }
}
?>


