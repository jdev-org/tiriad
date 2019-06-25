<?php
// get filename
$fichier=$_POST['filename'];
$geojsonStr=$_POST['content'];
$destFolder="/tmp/upload";
// get filecontent
$geojson = file_get_contents('php://input');
//save to disk
file_put_contents($destFolder . DIRECTORY_SEPARATOR .$fichier, $geojsonStr);
header('Content-type: application/json',true);
echo '{"success":true, "filepath":"'.$fichier.'", "geojsonString":'.$geojsonStr.'}';
?>
