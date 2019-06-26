<?php
header("Content-Type: application/json");

$fileName = $_POST['filename'];
$folder="/tmp/data/layers";
$strJsonFileContents = file_get_contents($folder. DIRECTORY_SEPARATOR .$fileName);
echo '{"filepath":"'$folder.$fileName.'", "path":'.$folder. DIRECTORY_SEPARATOR .$fileName.'}';
?>