<?php

require 'const.php';

// set header
header("Content-Type: application/json");
// get params
$filename = $_POST['filename'];
$path = SAVE_PATH.DIRECTORY_SEPARATOR.$filename;

// if file exist and we car remove it 
if (file_exists($path) && unlink($path)) {
    echo '{"success":true}';
} else {
    echo '{"success":false}';
}
?>
