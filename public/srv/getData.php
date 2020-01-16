<?php

require 'const.php';

header("Content-Type: application/json");

$fileName = $_POST['filename'];
$strJsonFileContents = file_get_contents(SAVE_PATH. DIRECTORY_SEPARATOR .$fileName);
echo '{"file":"'$fileName.'", "path":"'.SAVE_PATH. DIRECTORY_SEPARATOR .$fileName.'"}';
?>
