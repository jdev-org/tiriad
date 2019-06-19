<?php
// get filename
$fichier=$_POST['filename'];
$destFolder="../data"
// get filecontent
$geojson = file_get_contents('php://input');
//save to disk
file_put_contents($destFolder . DIRECTORY_SEPARATOR .$fichier, $geojson);
header('Content-type: application/json',true);
echo '{"success":true, "filepath":"'.$fichier.'"}';
?>
