<?php
//get filename
$fichier=$_POST['filename'];
//get json content
$geojsonStr=$_POST['content'];
//set output folder
$destFolder="../data/layers";
//save to disk
header('Content-type: application/json',true);
echo '{"success":true, "filepath":"'.$fichier.'", "geojsonString":'.$geojsonStr.'}';
?>
