<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');
echo json_encode([
  'db_name' => $db_name ?? null,
  'db_user' => $username ?? null
]);
