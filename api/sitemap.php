<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/xml; charset=UTF-8');

$baseUrl = rtrim(SITE_URL, '/');
$now = date('c');

$urls = [];
$urls[] = [
    'loc' => $baseUrl . '/',
    'changefreq' => 'daily',
    'priority' => '1.0',
    'lastmod' => $now,
];
$urls[] = [
    'loc' => $baseUrl . '/berita',
    'changefreq' => 'daily',
    'priority' => '0.8',
    'lastmod' => $now,
];
$urls[] = [
    'loc' => $baseUrl . '/agenda',
    'changefreq' => 'weekly',
    'priority' => '0.7',
    'lastmod' => $now,
];
$urls[] = [
    'loc' => $baseUrl . '/pengumuman',
    'changefreq' => 'weekly',
    'priority' => '0.7',
    'lastmod' => $now,
];
$urls[] = [
    'loc' => $baseUrl . '/ekskul',
    'changefreq' => 'weekly',
    'priority' => '0.6',
    'lastmod' => $now,
];

try {
    $stmt = $conn->query("SELECT id, created_at FROM posts ORDER BY id DESC");
    $posts = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    foreach ($posts as $post) {
        $urls[] = [
            'loc' => $baseUrl . '/berita/' . $post['id'],
            'changefreq' => 'weekly',
            'priority' => '0.6',
            'lastmod' => !empty($post['created_at']) ? date('c', strtotime($post['created_at'])) : $now,
        ];
    }

    $stmt = $conn->query("SELECT id, created_at FROM announcements ORDER BY id DESC");
    $announcements = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    foreach ($announcements as $item) {
        $urls[] = [
            'loc' => $baseUrl . '/pengumuman/' . $item['id'],
            'changefreq' => 'weekly',
            'priority' => '0.6',
            'lastmod' => !empty($item['created_at']) ? date('c', strtotime($item['created_at'])) : $now,
        ];
    }

    $stmt = $conn->query("SELECT id, created_at FROM agendas ORDER BY id DESC");
    $agendas = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    foreach ($agendas as $item) {
        $urls[] = [
            'loc' => $baseUrl . '/agenda/' . $item['id'],
            'changefreq' => 'weekly',
            'priority' => '0.5',
            'lastmod' => !empty($item['created_at']) ? date('c', strtotime($item['created_at'])) : $now,
        ];
    }

    $stmt = $conn->query("SELECT id, slug, created_at FROM pages ORDER BY id DESC");
    $pages = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    foreach ($pages as $page) {
        $slug = $page['slug'] ?? '';
        if ($slug === '') continue;
        $urls[] = [
            'loc' => $baseUrl . '/page/' . $slug,
            'changefreq' => 'monthly',
            'priority' => '0.5',
            'lastmod' => !empty($page['created_at']) ? date('c', strtotime($page['created_at'])) : $now,
        ];
    }
} catch (Exception $e) {
    // Fail silently to keep sitemap valid.
}

echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
foreach ($urls as $url) {
    $loc = htmlspecialchars($url['loc'], ENT_QUOTES, 'UTF-8');
    $lastmod = htmlspecialchars($url['lastmod'], ENT_QUOTES, 'UTF-8');
    $changefreq = htmlspecialchars($url['changefreq'], ENT_QUOTES, 'UTF-8');
    $priority = htmlspecialchars($url['priority'], ENT_QUOTES, 'UTF-8');
    echo "  <url>\n";
    echo "    <loc>{$loc}</loc>\n";
    echo "    <lastmod>{$lastmod}</lastmod>\n";
    echo "    <changefreq>{$changefreq}</changefreq>\n";
    echo "    <priority>{$priority}</priority>\n";
    echo "  </url>\n";
}
echo "</urlset>";

