<?php

require 'const.php';
header('Content-type: application/json',true);

SEPARATOR = '/' // or DIRECTORY_SEPARATOR

//get filename
$fichier=$_POST['filename'];
//get json content
$geojsonStr=$_POST['content'];
// WP
$isWP=isset($_POST['wp']);

// get folder to save file
$destFolder=SAVE_PATH;
if($isWP){
  $destFolder=EXPORT_PATH;
}

$isSaved = false;

//save to disk
if(isset($destFolder) && file_exists($destFolder)) {
  $isSaved = file_put_contents($destFolder.SEPARATOR.$fichier, $geojsonStr);
}

if($isSaved === false){
  echo '{"success":false, "error":"Fail to save data to path '.$destFolder.'"}';
} else {
  echo '{"success":true, "filepath":"'.$destFolder. SEPARATOR .$fichier.'", "geojsonString":'.$geojsonStr.'}';
}

?>
