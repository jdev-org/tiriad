<?php
//get filename
$fichier=$_POST['filename'];
//get json content
$geojsonStr=$_POST['content'];
//get file content
$geojson = file_get_contents('php://input');
//set output folder
$destFolder="/tmp/upload";
//save to disk
file_put_contents($destFolder . DIRECTORY_SEPARATOR .$fichier, $geojsonStr);
header('Content-type: application/json',true);
echo '{"success":true, "filepath":"'.$fichier.'", "geojsonString":'.$geojsonStr.'}';
?>
