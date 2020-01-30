<?php

require 'const.php';
header('Content-type: application/json',true);

//get filename
$fichier=$_POST['filename'];
//get json content
$geojsonStr=$_POST['content'];
// WP

// get folder to save file
$destFolder=SAVE_PATH;

$isSaved = false;

//save to disk
if(isset($destFolder) && file_exists($destFolder)) {
  $isSaved = file_put_contents($destFolder.DIRECTORY_SEPARATOR.$fichier, $geojsonStr);
}

if($isSaved === false){
  echo '{"success":false, "error":"Fail to save data to path '.$destFolder.'"}';
} else {
  echo '{"success":true, "filepath":"'.$destFolder. DIRECTORY_SEPARATOR .$fichier.'", "geojsonString":'.$geojsonStr.'}';
}

?>
