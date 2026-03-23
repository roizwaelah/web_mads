<?php
header("Access-Control-Allow-Origin: https://madarussalamcilongok.sch.id");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");
header("X-LiteSpeed-Cache-Control: no-cache");

// Tangani preflight request dari browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$db_name = "u688635524_mads";
$username = "u688635524_mads";
$password = "Achmad.12015.@";

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $exception) {
    echo json_encode(["status" => "error", "message" => "Connection error: " . $exception->getMessage()]);
    exit();
}


if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', getenv('JWT_SECRET') ?: '?Ra^:UIsfMMOd4_!@a+xLo03H>BnR[kxZKwm|=T:N');
}



if (!defined('SITE_URL')) {
    define('SITE_URL', getenv('SITE_URL') ?: 'https://madarussalamcilongok.sch.id');
}

