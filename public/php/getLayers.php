<?php
$dir = "./data/layers";
$layers = array();
// check if dir path is a directory
if(is_dir($dir)){
    // get files from dir
    if($dh = opendir($dir)){
        while(($file = readdir($dh)) != false){
            if($file != "." and $file != ".."){
                // read files infos
                $path = $dir. DIRECTORY_SEPARATOR .$file;
                if(file_get_contents($path) != '') {
                    // add files info to array
                    $layers[] = array(
                        'file' => $file,
                        'path' => $path,
                        'content' => file_get_contents($path)
                    );
                }
            }
        }
    }
}
header("Content-Type: application/json");
echo json_encode($layers);
?>
