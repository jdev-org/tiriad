<?php
// set header
header("Content-Type: application/json");
// get params
$dir = '../data/layers';
$filename = $_POST['filename'];
$path = $dir . DIRECTORY_SEPARATOR .$filename
// remove directory
if (file_exists($path)) 
    unlink($path_user.$file_name);
    echo '{"Success":true}'
} else {
    echo '{"Success":false}'
}
?>