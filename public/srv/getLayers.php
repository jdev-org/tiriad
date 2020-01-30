
<?php
require 'const.php';

// define layers array
$layers = array();

// check if dir path is a directory
if(is_dir(SAVE_PATH)){
    // get files from dir
    if($dh = opendir(SAVE_PATH)){
        // tant que le fichier trouvé n'est pas un répertoire
        while(($file = readdir($dh)) != false){
            if($file != "." and $file != ".." and !is_dir($file)){
                // read files infos
                $path = SAVE_PATH. DIRECTORY_SEPARATOR .$file;
                //TODO only for geojson, kml
                if(file_get_contents($path) != '') {
                    // add files info to array
                    $layers[] = array(
                        'name' => $file,
                        'path' => SAVE_PATH. DIRECTORY_SEPARATOR .$file
                        //'content' => file_get_contents($path)
                    );
                }
            }
        }
    }
}
header("Content-Type: application/json");
echo json_encode($layers);
?>
