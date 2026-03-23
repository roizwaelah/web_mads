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

function sanitize_html($html) {
    if (empty($html)) return '';
    $html = str_replace(['&nbsp;', '&#160;', '&amp;nbsp;'], ' ', $html);
    $html = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $html);
    $html = preg_replace('#<iframe(.*?)>(.*?)</iframe>#is', '', $html);
    $html = preg_replace('#<style(.*?)>(.*?)</style>#is', '', $html);
    $html = preg_replace('#\s*on[a-z]+\s*=\s*(["\']).*?\1#is', '', $html);
    return trim($html);
}

function create_slug($string) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $string)));
    return trim($slug, '-');
}

function normalize_form_schema($schema) {
    if (is_null($schema)) return null;
    if (is_string($schema)) {
        $schema = trim($schema);
        if ($schema === '') return null;
        $decoded = json_decode($schema, true);
        if (json_last_error() !== JSON_ERROR_NONE) return null;
        return json_encode($decoded);
    }
    if (is_array($schema) || is_object($schema)) {
        return json_encode($schema, JSON_UNESCAPED_UNICODE);
    }
    return null;
}

// MENGAMBIL DATA (GET)
if ($method === 'GET') {
    $stmt = $conn->query("SELECT id, title, slug, content, author, template, litespeed_cache, breadcrumbs, status, page_type, form_schema, data_module_id, DATE_FORMAT(created_at, '%d/%m/%Y') AS date FROM pages ORDER BY id DESC");
    $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format boolean untuk React
    $formatted_pages = array_map(function($p) {
        $p['litespeed_cache'] = (bool)$p['litespeed_cache'];
        return $p;
    }, $pages);

    echo json_encode(["status" => "success", "data" => $formatted_pages]);
}

// MENYIMPAN DATA (POST)
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    $pageType = isset($data->page_type) && $data->page_type === 'form' ? 'form' : 'static';
    $formSchema = normalize_form_schema($data->form_schema ?? null);
    $contentRaw = $data->content ?? '';
    $dataModuleId = isset($data->data_module_id) ? intval($data->data_module_id) : null;

    if (!empty($data->title) && ($pageType === 'form' || !empty($contentRaw))) {
        $clean_title   = sanitize_input($data->title);
        $clean_content = sanitize_html($contentRaw);
        $clean_author  = sanitize_input($data->author ?? 'Admin');
        
        // Tangkap 3 Data Baru
        $template      = sanitize_input($data->template ?? 'default');
        $litespeed     = isset($data->litespeed) && $data->litespeed ? 1 : 0;
        $breadcrumbsRaw = isset($data->breadcrumbs) ? $data->breadcrumbs : null;
        $breadcrumbs   = in_array($breadcrumbsRaw, ['inherit', 'enable', 'disable'], true) ? $breadcrumbsRaw : 'inherit';
        
        $status        = in_array($data->status, ['Draft', 'Publish']) ? $data->status : 'Draft';
        $slug          = !empty($data->slug) ? create_slug($data->slug) : create_slug($clean_title);
        
        // Mode UPDATE
        if (!empty($data->id)) {
            $stmt = $conn->prepare("UPDATE pages SET title = ?, slug = ?, content = ?, author = ?, template = ?, litespeed_cache = ?, breadcrumbs = ?, status = ?, page_type = ?, form_schema = ?, data_module_id = ? WHERE id = ?");
            if ($stmt->execute([$clean_title, $slug, $clean_content, $clean_author, $template, $litespeed, $breadcrumbs, $status, $pageType, $formSchema, $dataModuleId, $data->id])) {
                echo json_encode(["status" => "success", "message" => "Laman berhasil diperbarui."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memperbarui laman."]);
            }
        } 
        // Mode INSERT
        else {
            $check = $conn->prepare("SELECT id FROM pages WHERE slug = ?");
            $check->execute([$slug]);
            if ($check->rowCount() > 0) {
                $slug = $slug . '-' . time();
            }

            $stmt = $conn->prepare("INSERT INTO pages (title, slug, content, author, template, litespeed_cache, breadcrumbs, status, page_type, form_schema, data_module_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            if ($stmt->execute([$clean_title, $slug, $clean_content, $clean_author, $template, $litespeed, $breadcrumbs, $status, $pageType, $formSchema, $dataModuleId])) {
                echo json_encode(["status" => "success", "message" => "Laman berhasil diterbitkan."]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal menerbitkan laman."]);
            }
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Judul wajib diisi. Konten wajib untuk laman statis."]);
    }
}

// MENGHAPUS DATA (DELETE)
elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id > 0) {
        $stmt = $conn->prepare("DELETE FROM pages WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(["status" => "success", "message" => "Laman berhasil dihapus."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus laman."]);
        }
    }
}
?>

