<?php
require_once __DIR__ . '/config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__ . '/auth_middleware.php';

if ($method !== 'GET') {
    require_write_access(['Admin', 'Editor']);
}

$upload_dir = '../uploads/';
$chunk_dir  = '../uploads/tmp_chunks/';

$max_size = 5 * 1024 * 1024; // 5MB

if (!file_exists($upload_dir)) mkdir($upload_dir,0777,true);
if (!file_exists($chunk_dir)) mkdir($chunk_dir,0777,true);


/* ================================
   MIME TYPE YANG DIIZINKAN
================================ */

$allowed_mimes = [

    'image/jpeg' => 'image',
    'image/png'  => 'image',
    'image/gif'  => 'image',
    'image/webp' => 'image',
    'image/svg+xml' => 'image',

    'application/pdf' => 'document',
    'application/msword' => 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'document',
    'application/vnd.ms-excel' => 'document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'document'
];

/* =================================
   WEBP CONVERT (OPTIONAL)
================================= */

function load_webp_convert() {
    $candidates = [
        __DIR__ . '/vendor/autoload.php',
        dirname(__DIR__) . '/vendor/autoload.php'
    ];
    foreach ($candidates as $file) {
        if (file_exists($file)) {
            require_once $file;
            return class_exists('\\WebPConvert\\WebPConvert');
        }
    }
    return false;
}

function try_convert_webp($sourcePath) {
    if (!file_exists($sourcePath)) return;

    $ext = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png'])) return;

    if (!load_webp_convert()) return;

    $destination = preg_replace('/\.[^.]+$/', '.webp', $sourcePath);

    try {
        \WebPConvert\WebPConvert::convert($sourcePath, $destination, [
            'quality' => 82,
            'metadata' => 'none',
        ]);
    } catch (Exception $e) {
        // silently ignore conversion errors
    }
}


/* =================================
   GET MEDIA (LAZY LOADING)
================================= */

if ($method === 'GET') {

    $page  = max(1, intval($_GET['page'] ?? 1));
    $limit = max(1, intval($_GET['limit'] ?? 20));

    $offset = ($page - 1) * $limit;

    $type = $_GET['type'] ?? null;

    if ($type && in_array($type,['image','document'])) {

        $count = $conn->prepare("SELECT COUNT(*) FROM media WHERE file_type=?");
        $count->execute([$type]);
        $total = $count->fetchColumn();

        $stmt = $conn->prepare("
            SELECT * FROM media
            WHERE file_type=?
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        ");

        $stmt->bindValue(1,$type);
        $stmt->bindValue(2,$limit,PDO::PARAM_INT);
        $stmt->bindValue(3,$offset,PDO::PARAM_INT);
        $stmt->execute();

    } else {

        $total = $conn->query("SELECT COUNT(*) FROM media")->fetchColumn();

        $stmt = $conn->prepare("
            SELECT * FROM media
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        ");

        $stmt->bindValue(1,$limit,PDO::PARAM_INT);
        $stmt->bindValue(2,$offset,PDO::PARAM_INT);
        $stmt->execute();
    }

    $media = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($m){
        return [
            "id"=>$m['id'],
            "type"=>$m['file_type'],
            "url"=>$m['file_url'],
            "name"=>$m['file_name']
        ];
    }, $media);

    echo json_encode([
        "status"=>"success",
        "data"=>$formatted,
        "pagination"=>[
            "page"=>$page,
            "limit"=>$limit,
            "total"=>$total,
            "has_more"=>($offset + $limit) < $total
        ]
    ]);
}




/* =================================
   NORMAL UPLOAD
================================= */

elseif ($method === 'POST' && !isset($_POST['chunk'])) {

    if (!isset($_FILES['file'])) {
        echo json_encode(["status"=>"error","message"=>"File tidak ditemukan"]);
        exit;
    }

    $file = $_FILES['file'];

    if ($file['size'] > $max_size) {
        echo json_encode([
            "status"=>"error",
            "message"=>"Ukuran file maksimal 5MB"
        ]);
        exit;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);

    if (!isset($allowed_mimes[$mime])) {
        echo json_encode([
            "status"=>"error",
            "message"=>"Tipe file tidak diizinkan"
        ]);
        exit;
    }

    $type = $allowed_mimes[$mime];

    $name = preg_replace('/[^a-zA-Z0-9.\-_]/','',$file['name']);
    $new_name = uniqid().'_'.$name;

    $destination = $upload_dir.$new_name;

    if (!move_uploaded_file($file['tmp_name'],$destination)) {

        echo json_encode([
            "status"=>"error",
            "message"=>"Upload gagal"
        ]);
        exit;
    }

    if ($type === 'image') {
        try_convert_webp($destination);
    }

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https":"http";
    $url = $protocol."://".$_SERVER['HTTP_HOST']."/uploads/".$new_name;

    $stmt = $conn->prepare("
        INSERT INTO media (file_name,file_type,file_url)
        VALUES (?,?,?)
    ");

    $stmt->execute([$name,$type,$url]);

    $id = $conn->lastInsertId();

    echo json_encode([
        "status"=>"success",
        "data"=>[
            "id"=>$id,
            "type"=>$type,
            "url"=>$url,
            "name"=>$name
        ]
    ]);
}




/* =================================
   CHUNK UPLOAD (FILE BESAR)
================================= */

elseif ($method === 'POST' && isset($_POST['chunk'])) {

    $chunkIndex  = intval($_POST['chunk']);
    $totalChunks = intval($_POST['totalChunks']);

    $fileName = preg_replace('/[^a-zA-Z0-9.\-_]/','',$_POST['fileName']);
    $uploadId = $_POST['uploadId'];

    $tmpPath = $chunk_dir.$uploadId;

    if (!file_exists($tmpPath)) mkdir($tmpPath,0777,true);

    $chunkFile = $tmpPath."/chunk_".$chunkIndex;

    move_uploaded_file($_FILES['file']['tmp_name'],$chunkFile);

    if ($chunkIndex + 1 == $totalChunks) {

        $finalName = uniqid().'_'.$fileName;
        $finalPath = $upload_dir.$finalName;

        $out = fopen($finalPath,"wb");

        for ($i=0;$i<$totalChunks;$i++) {

            $chunk = fopen($tmpPath."/chunk_".$i,"rb");
            stream_copy_to_stream($chunk,$out);

            fclose($chunk);
            unlink($tmpPath."/chunk_".$i);
        }

        fclose($out);
        rmdir($tmpPath);

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($finalPath);

        if (!isset($allowed_mimes[$mime])) {

            unlink($finalPath);

            echo json_encode([
                "status"=>"error",
                "message"=>"File type tidak diizinkan"
            ]);
            exit;
        }

        $type = $allowed_mimes[$mime];

        if ($type === 'image') {
            try_convert_webp($finalPath);
        }

        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https":"http";
        $url = $protocol."://".$_SERVER['HTTP_HOST']."/uploads/".$finalName;

        $stmt = $conn->prepare("
            INSERT INTO media (file_name,file_type,file_url)
            VALUES (?,?,?)
        ");

        $stmt->execute([$fileName,$type,$url]);

        $id = $conn->lastInsertId();

        echo json_encode([
            "status"=>"success",
            "data"=>[
                "id"=>$id,
                "type"=>$type,
                "url"=>$url,
                "name"=>$fileName
            ]
        ]);

    } else {

        echo json_encode([
            "status"=>"chunk_received",
            "chunk"=>$chunkIndex
        ]);
    }
}




/* =================================
   DELETE MEDIA (SINGLE / BULK)
================================= */

elseif ($method === 'DELETE') {

    $input = json_decode(file_get_contents("php://input"),true);

    if (!isset($input['ids'])) {

        echo json_encode([
            "status"=>"error",
            "message"=>"ID tidak diberikan"
        ]);
        exit;
    }

    $ids = $input['ids'];

    if (!is_array($ids)) $ids = [$ids];

    $placeholders = implode(',',array_fill(0,count($ids),'?'));

    $stmt = $conn->prepare("
        SELECT file_url FROM media
        WHERE id IN ($placeholders)
    ");

    $stmt->execute($ids);
    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $deleted = 0;

    foreach ($files as $file) {

        $path = $upload_dir.basename($file['file_url']);

        if (file_exists($path)) unlink($path);

        $deleted++;
    }

    $stmt = $conn->prepare("
        DELETE FROM media
        WHERE id IN ($placeholders)
    ");

    $stmt->execute($ids);

    echo json_encode([
        "status"=>"success",
        "deleted"=>$deleted
    ]);
}

?>


