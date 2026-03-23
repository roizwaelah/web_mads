<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];

function sanitize_text($value) {
    return htmlspecialchars(trim((string)$value), ENT_QUOTES, 'UTF-8');
}

try {
    if ($method === 'GET') {
        $auth = require_auth();
        require_roles($auth, ['Admin', 'Read-Only', 'Demo']);

        $stmt = $conn->query("SELECT id, fullname, username, role, created_at FROM users ORDER BY id DESC");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit();
    }

    if ($method === 'POST') {
        $auth = require_auth();
        require_roles($auth, ['Admin']);

        $input = json_decode(file_get_contents("php://input"), true);
        $fullname = sanitize_text($input['fullname'] ?? '');
        $username = sanitize_text($input['username'] ?? '');
        $password = (string)($input['password'] ?? '');
        $role = sanitize_text($input['role'] ?? 'Editor');

        if ($fullname === '' || $username === '' || $password === '') {
            auth_json_response(422, ["status" => "error", "message" => "fullname, username, password wajib diisi"]);
        }

        if (!in_array($role, ['Admin', 'Editor', 'Read-Only', 'Demo'], true)) {
            auth_json_response(422, ["status" => "error", "message" => "Role tidak valid"]);
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        $sql = "INSERT INTO users (fullname, username, password, role) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$fullname, $username, $hashedPassword, $role]);
        echo json_encode(["status" => "success"]);
        exit();
    }

    if ($method === 'PUT') {
        $auth = require_auth();
        require_roles($auth, ['Admin']);

        $input = json_decode(file_get_contents("php://input"), true);
        $id = (int)($input['id'] ?? 0);
        $fullname = sanitize_text($input['fullname'] ?? '');
        $username = sanitize_text($input['username'] ?? '');
        $role = sanitize_text($input['role'] ?? 'Editor');
        $password = (string)($input['password'] ?? '');

        if ($id <= 0 || $fullname === '' || $username === '') {
            auth_json_response(422, ["status" => "error", "message" => "Data pengguna tidak valid"]);
        }

        if (!in_array($role, ['Admin', 'Editor', 'Read-Only', 'Demo'], true)) {
            auth_json_response(422, ["status" => "error", "message" => "Role tidak valid"]);
        }

        if ($password !== '') {
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $sql = "UPDATE users SET fullname = ?, username = ?, role = ?, password = ? WHERE id = ?";
            $params = [$fullname, $username, $role, $hashedPassword, $id];
        } else {
            $sql = "UPDATE users SET fullname = ?, username = ?, role = ? WHERE id = ?";
            $params = [$fullname, $username, $role, $id];
        }

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        echo json_encode(["status" => "success"]);
        exit();
    }

    if ($method === 'DELETE') {
        $auth = require_auth();
        require_roles($auth, ['Admin']);

        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            auth_json_response(422, ["status" => "error", "message" => "ID tidak valid"]);
        }

        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success"]);
        exit();
    }

    auth_json_response(405, ["status" => "error", "message" => "Method not allowed"]);
} catch (Exception $e) {
    auth_json_response(500, ["status" => "error", "message" => "Internal server error"]);
}



