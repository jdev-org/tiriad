<?php
header("Content-Type: application/json");

$fileName = $_POST['filename'];
$folder="../data/layers";
$strJsonFileContents = file_get_contents($folder. DIRECTORY_SEPARATOR .$fileName);
echo '{"content":'.$strJsonFileContents.'}';
echo '{"filepath":"'$folder.$fileName.'", "path":'.$folder. DIRECTORY_SEPARATOR .$fileName.'}';
?>