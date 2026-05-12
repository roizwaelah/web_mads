<?php
// Serve OG-friendly image (jpeg) for social crawlers.

function bad_request()
{
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Bad request';
    exit;
}

function not_found()
{
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}

$src = (string)($_GET['src'] ?? '');
if ($src === '' || strpos($src, '/') !== 0) {
    bad_request();
}

if (strpos($src, '/uploads/') !== 0 && $src !== '/dp.png' && $src !== '/favicon.png') {
    bad_request();
}

$root = dirname(__DIR__);
$realRoot = realpath($root);
if ($realRoot === false) {
    not_found();
}

$real = realpath($root . $src);
if ($real === false || !is_file($real)) {
    not_found();
}

if (strpos($real, $realRoot) !== 0) {
    bad_request();
}

$info = @getimagesize($real);
if ($info === false) {
    not_found();
}

$mime = (string)($info['mime'] ?? '');
$width = (int)($info[0] ?? 0);
$height = (int)($info[1] ?? 0);
if ($width < 1 || $height < 1) {
    not_found();
}

$canGd = function_exists('imagecreatetruecolor') && function_exists('imagejpeg');
if (!$canGd) {
    header('Content-Type: ' . ($mime !== '' ? $mime : 'application/octet-stream'));
    header('Cache-Control: public, max-age=604800');
    readfile($real);
    exit;
}

switch ($mime) {
    case 'image/jpeg':
        $srcImage = @imagecreatefromjpeg($real);
        break;
    case 'image/png':
        $srcImage = @imagecreatefrompng($real);
        break;
    case 'image/gif':
        $srcImage = @imagecreatefromgif($real);
        break;
    case 'image/webp':
        $srcImage = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($real) : false;
        break;
    default:
        $srcImage = false;
        break;
}

if (!$srcImage) {
    header('Content-Type: ' . ($mime !== '' ? $mime : 'application/octet-stream'));
    header('Cache-Control: public, max-age=604800');
    readfile($real);
    exit;
}

$targetW = 1200;
$targetH = 630;
$target = imagecreatetruecolor($targetW, $targetH);
$bg = imagecolorallocate($target, 255, 255, 255);
imagefill($target, 0, 0, $bg);

$scale = max($targetW / $width, $targetH / $height);
$cropW = (int)round($targetW / $scale);
$cropH = (int)round($targetH / $scale);
$srcX = max(0, (int)floor(($width - $cropW) / 2));
$srcY = max(0, (int)floor(($height - $cropH) / 2));

imagecopyresampled(
    $target,
    $srcImage,
    0,
    0,
    $srcX,
    $srcY,
    $targetW,
    $targetH,
    $cropW,
    $cropH
);

header('Content-Type: image/jpeg');
header('Cache-Control: public, max-age=604800');
imagejpeg($target, null, 84);

imagedestroy($srcImage);
imagedestroy($target);
