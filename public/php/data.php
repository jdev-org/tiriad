<?php
//get filename
$fichier=$_POST['filename'];
//get json content
$geojsonStr=$_POST['content'];
//set output folder
$destFolder="../data/layers";
//save to disk
file_put_contents($destFolder . DIRECTORY_SEPARATOR .$fichier, $geojsonStr);
header('Content-type: application/json',true);
echo '{"success":true, "filepath":"'.$fichier.'", "geojsonString":'.$geojsonStr.'}';
?>