<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_middleware.php';
$method = $_SERVER['REQUEST_METHOD'];

function create_slug($string) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', (string)$string)));
    return trim($slug, '-');
}

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
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $slug = isset($_GET['slug']) ? create_slug($_GET['slug']) : '';
    $stmt = $conn->query("SELECT id, title, description, event_date, DATE_FORMAT(event_date, '%d/%m/%Y') AS formatted_date, event_time, location, status FROM agendas ORDER BY event_date DESC");
    $agendas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $agendas = array_map(function ($agenda) {
        $agenda['slug'] = create_slug($agenda['title'] ?? '');
        return $agenda;
    }, $agendas);

    if ($id > 0 || $slug !== '') {
        $filtered = array_values(array_filter($agendas, function ($agenda) use ($id, $slug) {
            if ($id > 0 && intval($agenda['id']) === $id) return true;
            if ($slug !== '' && ($agenda['slug'] ?? '') === $slug) return true;
            return false;
        }));
        echo json_encode(["status" => "success", "data" => $filtered ? $filtered[0] : null]);
        return;
    }

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
