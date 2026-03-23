<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_middleware.php';

header("Access-Control-Allow-Origin: {$corsOrigin}");
header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$action = $_GET['action'] ?? '';
if ($action !== 'login') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
$username = trim((string)($input['username'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($username === '' || $password === '') {
    http_response_code(422);
    echo json_encode(["status" => "error", "message" => "Username dan password wajib diisi"]);
    exit();
}

try {
    $stmt = $conn->prepare("SELECT id, fullname, username, password, role FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Username atau password salah"]);
        exit();
    }

    $secret = JWT_SECRET;
    $issuedAt = time();
    $expiresAt = $issuedAt + (2 * 60 * 60);

    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload = [
        'sub' => (int)$user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'iat' => $issuedAt,
        'exp' => $expiresAt
    ];

    $base64UrlEncode = function ($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    };

    $headerEncoded = $base64UrlEncode(json_encode($header));
    $payloadEncoded = $base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true);
    $signatureEncoded = $base64UrlEncode($signature);
    $token = "$headerEncoded.$payloadEncoded.$signatureEncoded";

    echo json_encode([
        "status" => "success",
        "token" => $token,
        "user" => [
            "id" => (int)$user['id'],
            "fullname" => $user['fullname'],
            "username" => $user['username'],
            "role" => $user['role']
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Internal server error"]);
}
