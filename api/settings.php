<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_middleware.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

$method = $_SERVER['REQUEST_METHOD'];
$debug = isset($_GET['debug']) && $_GET['debug'] == '1';

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$settings) {
            $payload = ["status" => "error", "message" => "Data tidak ditemukan"];
            if ($debug) {
                $dbName = $conn->query('SELECT DATABASE()')->fetchColumn();
                $count = $conn->query('SELECT COUNT(*) FROM settings')->fetchColumn();
                $payload['debug'] = [
                    'database' => $dbName,
                    'settings_count' => (int)$count,
                ];
            }
            echo json_encode($payload);
            exit();
        }

        $stmtSlider = $conn->query("SELECT * FROM sliders");
        $sliders_db = $stmtSlider->fetchAll(PDO::FETCH_ASSOC);

        $sliders_formatted = array_map(function($s) {
            return [
                "id" => $s['id'],
                "image" => $s['image_url'],
                "title" => $s['title'],
                "subtitle" => $s['subtitle'],
                "buttonText" => $s['button_text'] ?? '',
                "buttonLink" => $s['button_link'] ?? ''
            ];
        }, $sliders_db);

        $response = [
            "logoUrl" => $settings['logo_url'],
            "faviconUrl" => $settings['favicon_url'] ?? '',
            "schoolName" => $settings['school_name'] ?? '',
            "schoolDescription" => $settings['school_description'] ?? '',
            "phone" => $settings['phone'],
            "email" => $settings['email'],
            "address" => $settings['address'],
            "social" => [
                "facebook" => $settings['social_fb'],
                "twitter" => $settings['social_tw'],
                "instagram" => $settings['social_ig'],
                "youtube" => $settings['social_yt']
            ],
            "sambutanKepala" => $settings['sambutan_kepala'] ?? '',
            "sambutanLinkSlug" => $settings['sambutan_link_slug'] ?? '',
            "sambutanFoto" => $settings['sambutan_foto'] ?? '',
            "headerStyle" => $settings['header_style'] ?? 'classic',
            "stickyHeader" => (bool)$settings['sticky_header'],
            "navigationMenu" => isset($settings['navigation_menu']) ? json_decode($settings['navigation_menu']) : [],
            "sliders" => $sliders_formatted,
            "primaryColor" => $settings['primary_color'],
            "accentColor" => $settings['accent_color'],
            "bodyColor" => $settings['body_color'] ?? '#1f2937',
            "bgColor" => $settings['bg_color'] ?? '#ffffff',
            "fontFamily" => $settings['font_family'],
            "fontSize" => $settings['font_size'] ?? '15px'
        ];

        echo json_encode(["status" => "success", "data" => $response]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('settings.php GET failed: ' . $e->getMessage());
        echo json_encode(["status" => "error", "message" => "Gagal mengambil data"]);
    }
    exit();
}

if ($method === 'POST') {
    $auth = require_auth();
    require_roles($auth, ['Admin']);

    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data)) {
        try {
            $conn->beginTransaction();
            $navMenu = json_encode($data->navigationMenu ?? []);

            $stmt = $conn->prepare("UPDATE settings SET 
                logo_url = ?, favicon_url = ?, school_name = ?, school_description = ?, phone = ?, email = ?, address = ?, 
                social_fb = ?, social_tw = ?, social_ig = ?, social_yt = ?, 
                sambutan_kepala = ?, sambutan_link_slug = ?, sambutan_foto = ?,
                header_style = ?, sticky_header = ?, navigation_menu = ?, 
                primary_color = ?, accent_color = ?, body_color = ?, bg_color = ?, 
                font_family = ?, font_size = ? WHERE id = 1");

            $stmt->execute([
                $data->logoUrl, $data->faviconUrl, ($data->schoolName ?? ''), ($data->schoolDescription ?? ''), $data->phone, $data->email, $data->address,
                $data->social->facebook, $data->social->twitter, $data->social->instagram, $data->social->youtube,
                ($data->sambutanKepala ?? ''), ($data->sambutanLinkSlug ?? ''), ($data->sambutanFoto ?? ''),
                $data->headerStyle, $data->stickyHeader ? 1 : 0, $navMenu,
                $data->primaryColor, $data->accentColor, $data->bodyColor, $data->bgColor,
                $data->fontFamily, $data->fontSize
            ]);

            $conn->exec("DELETE FROM sliders");
            if (!empty($data->sliders)) {
                $stmtSlider = $conn->prepare("INSERT INTO sliders (image_url, title, subtitle, button_text, button_link) VALUES (?, ?, ?, ?, ?)");
                foreach ($data->sliders as $slide) {
                    $stmtSlider->execute([
                        $slide->image, $slide->title, $slide->subtitle,
                        $slide->buttonText ?? '', $slide->buttonLink ?? '#'
                    ]);
                }
            }

            $conn->commit();
            echo json_encode(["status" => "success", "message" => "Pengaturan berhasil diperbarui"]);
        } catch (Exception $e) {
            $conn->rollBack();
            error_log('settings.php save failed: ' . $e->getMessage());
            echo json_encode(["status" => "error", "message" => "Gagal menyimpan: " . $e->getMessage()]);
        }
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>
