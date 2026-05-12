<?php
require_once __DIR__ . '/config.php';

const DEFAULT_SITE_NAME = 'Website Madrasah';
const DEFAULT_DESCRIPTION = 'Informasi kegiatan, agenda, pengumuman, dan berita terbaru.';
const DEFAULT_IMAGE = '/dp.png';
const DEFAULT_IMAGE_WIDTH = '1200';
const DEFAULT_IMAGE_HEIGHT = '630';

function escape_html($value = '')
{
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function slugify_title($value = '')
{
    $value = (string)$value;
    if (function_exists('iconv')) {
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($normalized !== false) {
            $value = $normalized;
        }
    }
    $value = strtolower($value);
    $value = preg_replace('/[^a-z0-9]+/', '-', $value);
    $value = trim((string)$value, '-');
    $value = preg_replace('/-+/', '-', (string)$value);
    return $value !== '' ? $value : 'item';
}

function strip_html_text($html = '')
{
    $text = preg_replace('/<(br|\/p|\/li|\/ol|\/ul|\/h[1-6])>/i', "\n", (string)$html);
    $text = preg_replace('/<style[^>]*>[\s\S]*?<\/style>/i', ' ', (string)$text);
    $text = preg_replace('/<script[^>]*>[\s\S]*?<\/script>/i', ' ', (string)$text);
    $text = strip_tags((string)$text);
    $text = html_entity_decode((string)$text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', (string)$text);
    return trim((string)$text);
}

function first_image_from_html($html = '')
{
    $content = (string)$html;
    if ($content === '') {
        return '';
    }

    if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $content, $matches) === 1) {
        return trim((string)($matches[1] ?? ''));
    }

    if (preg_match('#/uploads/[^\s"\']+\.(?:png|jpe?g|gif|webp|svg)#i', $content, $matches) === 1) {
        return trim((string)($matches[0] ?? ''));
    }

    return '';
}

function short_text($text = '', $maxLen = 155)
{
    $clean = trim((string)$text);
    if ($clean === '') return '';
    if (function_exists('mb_substr')) {
        return mb_substr($clean, 0, $maxLen);
    }
    return substr($clean, 0, $maxLen);
}

function current_origin()
{
    $proto = (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']))
        ? $_SERVER['HTTP_X_FORWARDED_PROTO']
        : ((!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off') ? 'https' : 'http');
    $host = $_SERVER['HTTP_HOST'] ?? parse_url(SITE_URL, PHP_URL_HOST) ?? 'localhost';
    return $proto . '://' . $host;
}

function normalize_image_url($url, $origin)
{
    $normalized = trim((string)$url);
    if ($normalized === '') {
        return $origin . DEFAULT_IMAGE;
    }
    if (preg_match('#^https?://#i', $normalized) === 1) {
        return preg_replace('#^http://#i', 'https://', $normalized);
    }
    if (strpos($normalized, '//') === 0) {
        return 'https:' . $normalized;
    }
    if (strpos($normalized, '/') === 0) {
        return $origin . $normalized;
    }
    if (strpos($normalized, 'uploads/') === 0) {
        return $origin . '/' . $normalized;
    }
    return $origin . DEFAULT_IMAGE;
}

function resolve_local_image_info($imageUrl, $origin)
{
    $info = [
        'imageWidth' => DEFAULT_IMAGE_WIDTH,
        'imageHeight' => DEFAULT_IMAGE_HEIGHT,
        'imageType' => 'image/jpeg',
    ];

    $prefix = $origin . '/';
    if (strpos((string)$imageUrl, $prefix) !== 0) {
        return $info;
    }

    $relativePath = substr((string)$imageUrl, strlen($origin));
    if (!is_string($relativePath) || strpos($relativePath, '/') !== 0) {
        return $info;
    }

    $localPath = dirname(__DIR__) . $relativePath;
    if (!is_file($localPath)) {
        return $info;
    }

    $imageSize = @getimagesize($localPath);
    if ($imageSize !== false) {
        $info['imageWidth'] = (string)($imageSize[0] ?? DEFAULT_IMAGE_WIDTH);
        $info['imageHeight'] = (string)($imageSize[1] ?? DEFAULT_IMAGE_HEIGHT);
        if (!empty($imageSize['mime'])) {
            $info['imageType'] = (string)$imageSize['mime'];
        }
    }

    return $info;
}

function build_og_image_url($imageUrl, $origin)
{
    $prefix = $origin . '/';
    if (strpos((string)$imageUrl, $prefix) !== 0) {
        return $imageUrl;
    }

    $relativePath = substr((string)$imageUrl, strlen($origin));
    if (!is_string($relativePath) || strpos($relativePath, '/') !== 0) {
        return $imageUrl;
    }

    if (strpos($relativePath, '/uploads/') !== 0 && $relativePath !== '/dp.png' && $relativePath !== '/favicon.png') {
        return $imageUrl;
    }

    return $origin . '/api/og-image.php?src=' . rawurlencode($relativePath);
}

function read_index_html()
{
    $root = dirname(__DIR__);
    $candidates = [
        $root . '/dist/index.html',
        $root . '/index.html',
    ];

    foreach ($candidates as $file) {
        if (is_file($file)) {
            return file_get_contents($file);
        }
    }

    throw new RuntimeException('index.html not found');
}

function inject_meta($html, $meta)
{
    $titleTag = '<title>' . escape_html($meta['title']) . '</title>';
    $imageAlt = $meta['imageAlt'] ?: $meta['title'];

    $metaBlock = "\n"
        . '    <meta name="description" content="' . escape_html($meta['description']) . "\" />\n"
        . '    <meta name="robots" content="index, follow, max-image-preview:large" />' . "\n"
        . '    <meta property="og:type" content="' . escape_html($meta['type']) . "\" />\n"
        . '    <meta property="og:title" content="' . escape_html($meta['title']) . "\" />\n"
        . '    <meta property="og:description" content="' . escape_html($meta['description']) . "\" />\n"
        . '    <meta property="og:url" content="' . escape_html($meta['url']) . "\" />\n"
        . '    <meta property="og:site_name" content="' . escape_html($meta['siteName']) . "\" />\n"
        . '    <meta property="og:locale" content="id_ID" />' . "\n"
        . '    <meta property="og:image" content="' . escape_html($meta['image']) . "\" />\n"
        . '    <meta property="og:image:url" content="' . escape_html($meta['image']) . "\" />\n"
        . '    <meta property="og:image:secure_url" content="' . escape_html($meta['image']) . "\" />\n"
        . '    <meta property="og:image:width" content="' . escape_html($meta['imageWidth']) . "\" />\n"
        . '    <meta property="og:image:height" content="' . escape_html($meta['imageHeight']) . "\" />\n"
        . '    <meta property="og:image:type" content="' . escape_html($meta['imageType']) . "\" />\n"
        . '    <meta property="og:image:alt" content="' . escape_html($imageAlt) . "\" />\n"
        . '    <meta name="twitter:card" content="summary_large_image" />' . "\n"
        . '    <meta name="twitter:title" content="' . escape_html($meta['title']) . "\" />\n"
        . '    <meta name="twitter:description" content="' . escape_html($meta['description']) . "\" />\n"
        . '    <meta name="twitter:url" content="' . escape_html($meta['url']) . "\" />\n"
        . '    <meta name="twitter:image" content="' . escape_html($meta['image']) . "\" />\n"
        . '    <meta name="twitter:image:alt" content="' . escape_html($imageAlt) . "\" />\n"
        . '    <link rel="canonical" href="' . escape_html($meta['url']) . "\" />\n";

    $output = (string)$html;
    $output = preg_replace('/<title>[\s\S]*?<\/title>/i', $titleTag, $output, 1);
    $output = preg_replace('/<meta\s+name="description"[^>]*>\s*/i', '', $output);
    $output = preg_replace('/<meta\s+name="robots"[^>]*>\s*/i', '', $output);
    $output = preg_replace('/<link\s+rel="canonical"[^>]*>\s*/i', '', $output);
    $output = preg_replace('/<meta\s+(?:property|name)="og:[^"]*"[^>]*>\s*/i', '', $output);
    $output = preg_replace('/<meta\s+(?:property|name)="twitter:[^"]*"[^>]*>\s*/i', '', $output);

    return str_replace('</head>', $metaBlock . "  </head>", (string)$output);
}

function request_path()
{
    $rewritten = $_GET['path'] ?? '';
    if (is_string($rewritten) && strpos($rewritten, '/') === 0) {
        return $rewritten;
    }
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    $path = parse_url($uri, PHP_URL_PATH);
    return is_string($path) && $path !== '' ? $path : '/';
}

function is_debug_request()
{
    $flag = strtolower((string)($_GET['__meta_debug'] ?? ''));
    return in_array($flag, ['1', 'true', 'yes', 'on'], true);
}

function meta_for_path($pdo, $pathname, $origin, $siteName, $siteDescription, $defaultImage)
{
    $pageUrl = $origin . $pathname;

    if (strpos($pathname, '/berita/') === 0) {
        $slug = strtolower(trim((string)urldecode(substr($pathname, strlen('/berita/')))));
        $stmt = $pdo->query("SELECT title, content, image, status FROM posts ORDER BY id DESC");
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        foreach ($rows as $row) {
            if (($row['status'] ?? '') !== 'Publish') continue;
            if (slugify_title($row['title'] ?? '') !== $slug) continue;
            $description = short_text(strip_html_text($row['content'] ?? ''), 155) ?: $siteDescription;
            $imageCandidate = ($row['image'] ?? '') !== '' ? $row['image'] : first_image_from_html($row['content'] ?? '');
            $image = normalize_image_url($imageCandidate, $origin);
            if ($image === $origin . DEFAULT_IMAGE && $defaultImage !== '') {
                $image = $defaultImage;
            }
            $image = build_og_image_url($image, $origin);
            $imageInfo = resolve_local_image_info($image, $origin);
            return [
                'title' => ($row['title'] ?? $siteName) . ' | ' . $siteName,
                'description' => $description,
                'image' => $image,
                'imageAlt' => $row['title'] ?? $siteName,
                'url' => $pageUrl,
                'type' => 'article',
                'siteName' => $siteName,
                'imageWidth' => $imageInfo['imageWidth'],
                'imageHeight' => $imageInfo['imageHeight'],
                'imageType' => $imageInfo['imageType'],
            ];
        }
    }

    if (strpos($pathname, '/agenda/') === 0) {
        $slug = strtolower(trim((string)urldecode(substr($pathname, strlen('/agenda/')))));
        $stmt = $pdo->query("SELECT title, description, status FROM agendas ORDER BY event_date DESC");
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        foreach ($rows as $row) {
            if (($row['status'] ?? '') !== 'Publish') continue;
            if (slugify_title($row['title'] ?? '') !== $slug) continue;
            $description = short_text(strip_html_text($row['description'] ?? ''), 155) ?: $siteDescription;
            $imageCandidate = first_image_from_html($row['description'] ?? '');
            $image = normalize_image_url($imageCandidate, $origin);
            if ($image === $origin . DEFAULT_IMAGE && $defaultImage !== '') {
                $image = $defaultImage;
            }
            $image = build_og_image_url($image, $origin);
            $imageInfo = resolve_local_image_info($image, $origin);
            return [
                'title' => ($row['title'] ?? $siteName) . ' | ' . $siteName,
                'description' => $description,
                'image' => $image,
                'imageAlt' => $row['title'] ?? $siteName,
                'url' => $pageUrl,
                'type' => 'article',
                'siteName' => $siteName,
                'imageWidth' => $imageInfo['imageWidth'],
                'imageHeight' => $imageInfo['imageHeight'],
                'imageType' => $imageInfo['imageType'],
            ];
        }
    }

    if (strpos($pathname, '/pengumuman/') === 0) {
        $slug = strtolower(trim((string)urldecode(substr($pathname, strlen('/pengumuman/')))));
        $stmt = $pdo->query("SELECT title, content, status FROM announcements ORDER BY id DESC");
        $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        foreach ($rows as $row) {
            if (($row['status'] ?? '') !== 'Publish') continue;
            if (slugify_title($row['title'] ?? '') !== $slug) continue;
            $description = short_text(strip_html_text($row['content'] ?? ''), 155) ?: $siteDescription;
            $imageCandidate = first_image_from_html($row['content'] ?? '');
            $image = normalize_image_url($imageCandidate, $origin);
            if ($image === $origin . DEFAULT_IMAGE && $defaultImage !== '') {
                $image = $defaultImage;
            }
            $image = build_og_image_url($image, $origin);
            $imageInfo = resolve_local_image_info($image, $origin);
            return [
                'title' => ($row['title'] ?? $siteName) . ' | ' . $siteName,
                'description' => $description,
                'image' => $image,
                'imageAlt' => $row['title'] ?? $siteName,
                'url' => $pageUrl,
                'type' => 'article',
                'siteName' => $siteName,
                'imageWidth' => $imageInfo['imageWidth'],
                'imageHeight' => $imageInfo['imageHeight'],
                'imageType' => $imageInfo['imageType'],
            ];
        }
    }

    if (strpos($pathname, '/page/') === 0) {
        $slug = strtolower(trim((string)urldecode(substr($pathname, strlen('/page/')))));
        $stmt = $pdo->prepare("SELECT title, content, status FROM pages WHERE slug = ? LIMIT 1");
        $stmt->execute([$slug]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && ($row['status'] ?? '') === 'Publish') {
            $description = short_text(strip_html_text($row['content'] ?? ''), 155) ?: $siteDescription;
            $image = build_og_image_url($defaultImage, $origin);
            $imageInfo = resolve_local_image_info($defaultImage, $origin);
            return [
                'title' => ($row['title'] ?? $siteName) . ' | ' . $siteName,
                'description' => $description,
                'image' => $image,
                'imageAlt' => $row['title'] ?? $siteName,
                'url' => $pageUrl,
                'type' => 'article',
                'siteName' => $siteName,
                'imageWidth' => $imageInfo['imageWidth'],
                'imageHeight' => $imageInfo['imageHeight'],
                'imageType' => $imageInfo['imageType'],
            ];
        }
    }

    $image = build_og_image_url($defaultImage, $origin);
    $imageInfo = resolve_local_image_info($defaultImage, $origin);
    return [
        'title' => $siteName,
        'description' => $siteDescription,
        'image' => $image,
        'imageAlt' => $siteName,
        'url' => $pageUrl,
        'type' => 'website',
        'siteName' => $siteName,
        'imageWidth' => $imageInfo['imageWidth'],
        'imageHeight' => $imageInfo['imageHeight'],
        'imageType' => $imageInfo['imageType'],
    ];
}

try {
    $origin = current_origin();
    $pathname = request_path();
    $html = read_index_html();

    $settingsStmt = $conn->query("SELECT school_name, school_description, logo_url FROM settings ORDER BY id ASC LIMIT 1");
    $settings = $settingsStmt ? $settingsStmt->fetch(PDO::FETCH_ASSOC) : [];
    $siteName = trim((string)($settings['school_name'] ?? DEFAULT_SITE_NAME));
    if ($siteName === '') $siteName = DEFAULT_SITE_NAME;
    $siteDescription = trim((string)($settings['school_description'] ?? DEFAULT_DESCRIPTION));
    if ($siteDescription === '') $siteDescription = DEFAULT_DESCRIPTION;

    // Per request: fallback image untuk berita/pengumuman/agenda gunakan logo header.
    $defaultImageCandidate = trim((string)($settings['logo_url'] ?? ''));
    if ($defaultImageCandidate === '') $defaultImageCandidate = DEFAULT_IMAGE;
    $defaultImage = normalize_image_url($defaultImageCandidate, $origin);

    $meta = meta_for_path($conn, $pathname, $origin, $siteName, $siteDescription, $defaultImage);

    if (is_debug_request()) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        echo json_encode([
            'ok' => true,
            'path' => $pathname,
            'meta' => $meta,
            'timestamp' => gmdate('c'),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $output = inject_meta($html, $meta);

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    echo $output;
} catch (Throwable $e) {
    header('Content-Type: text/plain; charset=utf-8');
    http_response_code(500);
    echo 'Failed to render share metadata.';
}
