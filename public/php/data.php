<?php
//get filename
$fichier=$_POST['filename'];
//get json content
$geojsonStr=$_POST['content'];
// get folder to save file
$destFolder=$_POST['path'];
//save to disk
if(isset($destFolder) && file_exists($destFolder)) {;
    file_put_contents($destFolder . DIRECTORY_SEPARATOR .$fichier, $geojsonStr);
    header('Content-type: application/json',true);
    echo '{"success":true, "filepath":"'.$destFolder. DIRECTORY_SEPARATOR .$fichier.'", "geojsonString":'.$geojsonStr.'}';
} else {
    echo '{"success":false, "error":"Fail to save data to path '.$destFolder.'"}';
}
?>