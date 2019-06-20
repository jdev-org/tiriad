<?php
// get filename
$fichier=$_POST['filename'];
$destFolder="/tmp";
// get filecontent
$geojson = file_get_contents('php://input');
//save to disk
file_put_contents($destFolder . DIRECTORY_SEPARATOR .$fichier, $geojson);
header('Content-type: application/json',true);
echo '{"content":"'.$geojson.'", success":true, "filepath":"'.$fichier.'"}';
?>
