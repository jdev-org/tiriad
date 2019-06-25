<?php
header("Content-Type: application/json");

$fileName = $_POST['filename']
$strJsonFileContents = file_get_contents("/tmp/upload/".$fileName);
echo $strJsonFileContents
?>