<?php
$dir = __DIR__;
$files = glob($dir . "/*.php");
foreach ($files as $file) {
    $data = file_get_contents($file);
    $data = preg_replace('/^\xEF\xBB\xBF/', '', $data);
    file_put_contents($file, $data);
    echo "cleaned: " . basename($file) . "<br>";
}
