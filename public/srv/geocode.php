<?php

header('Content-type: application/json',true);

//url d'appel du service nominatim
$url = 'https://nominatim.openstreetmap.org/search?';


if (isset($_FILES['data'])) {

  //if there was an error uploading the file
  if ($_FILES["data"]["error"] > 0) {
    echo '{"status":failed, "message":.$_FILES["data"]["error"].}';
  }//TODO else if size to big
  else {
    // Read line by ligne
    if(($fileHandle = fopen($_FILES['data']["tmp_name"], 'r')) !== FALSE){
      // Check headers
      $headers = fgetcsv($fileHandle,"1024",";");

      if($headers == FALSE || $headers == NULL){
        echo '{"status":failed, "message":"Empty file"}';
      }
      else{
        $lowerCaseHeaders = array_map('strtolower',$headers);
        // search in headers incasensitive
        $adresse = array_search(strtolower('adresse'), $lowerCaseHeaders);
        $code_postal = array_search(strtolower('code_postal'), $lowerCaseHeaders);
        $ville = array_search(strtolower('ville'), $lowerCaseHeaders);
        $pays = array_search(strtolower('pays'), $lowerCaseHeaders);

        if( $adresse == FALSE || $code_postal == FALSE || $ville == FALSE){
          echo '{"status":failed, "message":"Somme headers information are missing at least nom;code_categorie;adresse;code_postale;ville"}';
        }else{
          $json = array();

          $context_http = stream_context_create(
            array(
              "http" => array(
                "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36"
              )
            )
          );

          $nbResultat=0;
          while (($line = fgetcsv($fileHandle, "1024", ";")) !== FALSE) {

            $queryAdresse = trim($line[$adresse]).','.trim($line[$code_postal]).' '.trim($line[$ville]);
            // limit 1 is required to avoid  multiple value for one point
            $params = http_build_query(array('q' => $queryAdresse, 'format' => 'geojson', 'limit' => '1'));
            $appel_api = file_get_contents($url.$params, false, $context_http);

            // no result
            if($appel_api == FALSE){
               $errorsGeocoding[] = array_combine($headers, $line);
            }else{

              $resultat = json_decode($appel_api);

              // Clean results and replace properties by csv informations if address found
              if($resultat->{'features'}[0]->{'type'} == 'Feature'){
                $resultat->{'features'}[0]->{'properties'} = array_combine($headers, $line);

                if($nbResultat==0){
                  $json=$resultat;
                }else{
                  $json->{'features'}[] = $resultat->{'features'}[0];
                }
                $nbResultat++;

              }else{
                $errorsGeocoding[] = array_combine($headers, $line);
              }
            }
          }
          fclose($fileHandle);

          echo json_encode($json, JSON_NUMERIC_CHECK);
          }
        }
      }else{
        echo '{"status":failed, "message":"could not read file"}';
      }
    }

  // $lines = explode("\r\n", $data); // split the string by new lines
  // foreach($lines as $line){ // Loop over each line
  //     $column = explode(",", $line); // split the line in 'columns'
  //     $name = $column[0];
  //     $street = $column[1];
  // }

  // Géocodage
  // foreach($adresses as $adresse)
  // {
  //     $params = http_build_query(array('q' => $adresse, 'format' => 'json'));
  //     $appel_api = file_get_contents($url.$params);
  //     $resultats = json_decode($appel_api);
  //     echo var_export($resultats, true);
  // }

}else{
  echo '{"status":failed, "error":"Fail to load data from call"}';
}
?>
