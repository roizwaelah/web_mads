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

function sanitize_email($email) {
    $email = trim((string)$email);
    return $email ? filter_var($email, FILTER_SANITIZE_EMAIL) : '';
}

function sanitize_url($url) {
    $url = trim((string)$url);
    return $url ? filter_var($url, FILTER_SANITIZE_URL) : '';
}

function sanitize_content($html) {
    if (empty($html)) return '';
    $html = str_replace(['&nbsp;', '&#160;', '&amp;nbsp;'], ' ', $html);
    $html = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $html);
    $html = preg_replace('#<iframe(.*?)>(.*?)</iframe>#is', '', $html);
    $html = preg_replace('#<style(.*?)>(.*?)</style>#is', '', $html);
    $html = preg_replace('#<object(.*?)>(.*?)</object>#is', '', $html);
    $html = preg_replace('#\s*on[a-z]+\s*=\s*(["\"]).*?\1#is', '', $html);
    return trim($html);
}

$allowedStatuses = ['pending', 'approved', 'spam', 'trash'];

if ($method === 'GET') {
    $status = isset($_GET['status']) ? strtolower($_GET['status']) : 'all';
    $postId = isset($_GET['post_id']) ? intval($_GET['post_id']) : 0;
    $params = [];

    $sql = "SELECT c.id, c.post_id, c.parent_id, p.title AS postTitle, c.author_name AS author, c.author_email AS email, c.author_url AS url, c.content, c.status, DATE_FORMAT(c.created_at, '%d/%m/%Y %H:%i') AS date FROM comments c LEFT JOIN posts p ON c.post_id = p.id";
    $where = [];

    if ($status !== 'all' && in_array($status, $allowedStatuses)) {
        $where[] = "c.status = ?";
        $params[] = $status;
    }

    if ($postId > 0) {
        $where[] = "c.post_id = ?";
        $params[] = $postId;
    }

    if (count($where) > 0) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }

    $sql .= " ORDER BY c.id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $comments]);
}

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->action) && $data->action === 'batch_update') {
        $status = in_array($data->status ?? '', $allowedStatuses) ? $data->status : 'pending';
        $ids = isset($data->ids) && is_array($data->ids) ? $data->ids : [];
        $ids = array_values(array_filter(array_map('intval', $ids), function($val){ return $val > 0; }));

        if (count($ids) === 0) {
            echo json_encode(["status" => "error", "message" => "ID komentar tidak valid."]);
            exit;
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $params = array_merge([$status], $ids);
        $stmt = $conn->prepare("UPDATE comments SET status = ? WHERE id IN ($placeholders)");

        if ($stmt->execute($params)) {
            echo json_encode(["status" => "success", "message" => "Komentar berhasil diperbarui.", "updated" => $stmt->rowCount()]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal memperbarui komentar."]);
        }
        exit;
    }

    if (!empty($data->id)) {
        $status = in_array($data->status ?? '', $allowedStatuses) ? $data->status : 'pending';
        $stmt = $conn->prepare("UPDATE comments SET status = ? WHERE id = ?");

        if ($stmt->execute([$status, $data->id])) {
            echo json_encode(["status" => "success", "message" => "Komentar berhasil diperbarui."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal memperbarui komentar."]);
        }
        exit;
    }

    if (!empty($data->author) && !empty($data->content)) {
        $author = sanitize_text($data->author);
        $email = sanitize_email($data->email ?? '');
        $url = sanitize_url($data->url ?? '');
        $content = sanitize_content($data->content);
        $postId = !empty($data->post_id) ? intval($data->post_id) : null;
        $parentId = !empty($data->parent_id) ? intval($data->parent_id) : null;
        $status = in_array($data->status ?? '', $allowedStatuses) ? $data->status : 'pending';

        $stmt = $conn->prepare("INSERT INTO comments (post_id, parent_id, author_name, author_email, author_url, content, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $params = [$postId, $parentId, $author, $email, $url, $content, $status];

        if ($stmt->execute($params)) {
            echo json_encode(["status" => "success", "message" => "Komentar berhasil ditambahkan."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan komentar."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Nama dan konten komentar wajib diisi."]);
    }
}

elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM comments WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(["status" => "success", "message" => "Komentar berhasil dihapus."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus komentar."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "ID komentar tidak valid."]);
    }
}
?>

