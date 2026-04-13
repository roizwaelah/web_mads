<?php
$timezone = getenv('APP_TIMEZONE') ?: 'Asia/Jakarta';
if (function_exists('date_default_timezone_set')) {
    date_default_timezone_set($timezone);
}

$allowedOrigins = [
    'https://madarussalamcilongok.sch.id',
    'http://localhost:5173',
];

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$corsOrigin = in_array($requestOrigin, $allowedOrigins, true)
    ? $requestOrigin
    : 'https://madarussalamcilongok.sch.id';

header("Access-Control-Allow-Origin: {$corsOrigin}");
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-LiteSpeed-Cache-Control: no-cache');

// Tangani preflight request dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'mads';
$username = getenv('DB_USERNAME') ?: 'root';
$password = getenv('DB_PASSWORD') ?: '';

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->exec("SET time_zone = '+07:00'");
} catch (PDOException $exception) {
    echo json_encode(['status' => 'error', 'message' => 'Connection error: ' . $exception->getMessage()]);
    exit();
}

if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', getenv('JWT_SECRET') ?: '?Ra^:UIsfMMOd4_!@a+xLo03H>BnR[kxZKwm|=T:N');
}

$detectedSiteUrl = getenv('SITE_URL');
if (!$detectedSiteUrl) {
    $requestScheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $requestHost = $_SERVER['HTTP_HOST'] ?? '';

    if ($requestHost === 'localhost:8000' || $requestHost === '127.0.0.1:8000') {
        $detectedSiteUrl = sprintf('%s://%s', $requestScheme, $requestHost);
    } else {
        $detectedSiteUrl = 'https://madarussalamcilongok.sch.id';
    }
}

if (!defined('SITE_URL')) {
    define('SITE_URL', $detectedSiteUrl);
}
