<?php
if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', getenv('JWT_SECRET') ?: 'change_this_secret_in_production');
}

function auth_json_response($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit();
}

function auth_get_authorization_header() {
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }
    if (isset($_SERVER['Authorization'])) {
        return trim($_SERVER['Authorization']);
    }
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                return trim($value);
            }
        }
    }
    return '';
}

function auth_get_bearer_token() {
    $header = auth_get_authorization_header();
    if (!$header) return '';
    if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
        return trim($matches[1]);
    }
    return '';
}

function auth_base64url_decode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function auth_verify_jwt($token) {
    if (!$token) return null;

    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

    $header = json_decode(auth_base64url_decode($headerEncoded), true);
    $payload = json_decode(auth_base64url_decode($payloadEncoded), true);

    if (!is_array($header) || !is_array($payload)) return null;
    if (($header['alg'] ?? '') !== 'HS256') return null;

    $expectedSig = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", JWT_SECRET, true);
    $actualSig = auth_base64url_decode($signatureEncoded);

    if (!hash_equals($expectedSig, $actualSig)) return null;

    if (!isset($payload['exp']) || time() >= (int)$payload['exp']) return null;

    return $payload;
}

function require_auth() {
    $token = auth_get_bearer_token();
    $payload = auth_verify_jwt($token);
    if (!$payload) {
        auth_json_response(401, ["status" => "error", "message" => "Unauthorized"]);
    }
    return $payload;
}

function require_roles($payload, $roles = []) {
    $role = $payload['role'] ?? '';
    if (!in_array($role, $roles, true)) {
        auth_json_response(403, ["status" => "error", "message" => "Forbidden"]);
    }
}

function require_write_access($allowedRoles = ['Admin', 'Editor']) {
    $payload = require_auth();
    require_roles($payload, $allowedRoles);
    return $payload;
}

