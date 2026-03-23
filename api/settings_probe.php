<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=UTF-8');

try {
    $dbName = $conn->query('SELECT DATABASE()')->fetchColumn();
    $count = $conn->query('SELECT COUNT(*) FROM settings')->fetchColumn();
    $row = $conn->query('SELECT id FROM settings LIMIT 1')->fetch(PDO::FETCH_ASSOC);
    echo json_encode([
        'status' => 'success',
        'database' => $dbName,
        'settings_count' => (int)$count,
        'first_id' => $row ? $row['id'] : null,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
    ]);
}
