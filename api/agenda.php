<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_middleware.php';
$method = $_SERVER['REQUEST_METHOD'];

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
    return trim($html);
}

if ($method === 'GET') {
    // Ambil data dan format tanggalnya
    $stmt = $conn->query("SELECT id, title, description, event_date, DATE_FORMAT(event_date, '%d/%m/%Y') AS formatted_date, event_time, location, status FROM agendas ORDER BY event_date DESC");
    $agendas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $agendas]);
}

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->title) && !empty($data->event_date)) {
        $clean_title = sanitize_input($data->title);
        $clean_desc  = sanitize_html($data->description ?? '');
        $event_date  = sanitize_input($data->event_date);
        $event_time  = sanitize_input($data->event_time ?? '');
        $location    = sanitize_input($data->location ?? '');
        $status      = in_array($data->status, ['Draft', 'Publish']) ? $data->status : 'Draft';
        
        if (!empty($data->id)) {
            $stmt = $conn->prepare("UPDATE agendas SET title = ?, description = ?, event_date = ?, event_time = ?, location = ?, status = ? WHERE id = ?");
            if ($stmt->execute([$clean_title, $clean_desc, $event_date, $event_time, $location, $status, $data->id])) {
                echo json_encode(["status" => "success", "message" => "Agenda berhasil diperbarui."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memperbarui agenda."]);
            }
        } else {
            $stmt = $conn->prepare("INSERT INTO agendas (title, description, event_date, event_time, location, status) VALUES (?, ?, ?, ?, ?, ?)");
            if ($stmt->execute([$clean_title, $clean_desc, $event_date, $event_time, $location, $status])) {
                echo json_encode(["status" => "success", "message" => "Agenda berhasil diterbitkan."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal menerbitkan agenda."]);
            }
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Judul dan Tanggal Acara wajib diisi."]);
    }
}

elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM agendas WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(["status" => "success", "message" => "Agenda berhasil dihapus."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus agenda."]);
        }
    }
}
?>



