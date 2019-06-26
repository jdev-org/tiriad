<?php
// set header
header("Content-Type: application/json");
// get params
$dir = '../data/layers';
$filename = $_POST['filename'];
$path = $dir . DIRECTORY_SEPARATOR .$filename;
// remove directory
if (file_exists($path)) {
    unlink($path);
    echo '{"success":true}';
} else {
    echo '{"success":false}';
}
?>