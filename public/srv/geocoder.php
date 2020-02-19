<?php
require 'const.php';

header('Content-type: application/json',true);

if (isset($_FILES['data'])) {

  //if there was an error uploading the file
  if ($_FILES["data"]["error"] > 0) {
    echo '{"success":false, "message":.$_FILES["data"]["error"].}';
  }//TODO else if size to big
  else {
    // Read line by ligne
    if(($fileHandle = fopen($_FILES['data']["tmp_name"], 'r')) !== FALSE){
      // Check headers
      $headers = fgetcsv($fileHandle,"1024",";");

      if($headers == FALSE || $headers == NULL){
        echo '{"success":false, "message":"Empty file"}';
      }
      else{
        $lowerCaseHeaders = array_map('strtolower',$headers);
        // search in headers incasensitive
        $adresse = array_search(strtolower('adresse'), $lowerCaseHeaders);
        $code_postal = array_search(strtolower('code_postal'), $lowerCaseHeaders);
        $ville = array_search(strtolower('ville'), $lowerCaseHeaders);
        $pays = array_search(strtolower('pays'), $lowerCaseHeaders);

        if( $adresse == FALSE || $code_postal == FALSE || $ville == FALSE){
          echo '{"success":false, "message":"Some header informations are missing at least \'nom;code_categorie;adresse;ville;pays\' are required"}';
        }else{
          $json = array();
          $errorsGeocoding = array();

          $context_http = stream_context_create(
            array(
              "http" => array(
                "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36"
              )
            )
          );

          $nbResultat=0;
          while (($line = fgetcsv($fileHandle, "1024", ";")) !== FALSE) {
            // limit 1 is required to avoid  multiple value for one point
            $params = http_build_query(
                array('street' => trim($line[$adresse]),
                      'city' => trim($line[$ville]),
                      'postalcode' => trim($line[$code_postal]),
                      'country' => trim($line[$pays]),
                      'format' => 'geojson',
                      'limit' => '1'));
            $appel_api = file_get_contents(GEOCODER_URL.$params, false, $context_http);

            // no result
            if($appel_api == FALSE){
               $errorsGeocoding[] = array_combine($headers, $line);
            }else{
              $resultat = json_decode($appel_api);

              // Clean results and replace properties by csv informations if address found
              if($resultat->{'features'} && $resultat->{'features'}[0]->{'type'} == 'Feature'){
                $resultat->{'features'}[0]->{'properties'} = array_combine($headers, $line);

                if($nbResultat == 0){
                  $json['geocoded'] = $resultat;
                }else{
                  $json['geocoded']->{'features'}[] = $resultat->{'features'}[0];
                }
                $nbResultat++;

              }else{
                $errorsGeocoding[] = array_combine($headers, $line);
              }
            }
          }

          fclose($fileHandle);
          $json['notgeocoded'] = $errorsGeocoding;
          echo json_encode($json, JSON_NUMERIC_CHECK);
          }
        }
      }else{
        echo '{"success":false, "message":"could not read file"}';
      }
    }

}else{
  echo '{"success":false, "error":"Fail to load data from call"}';
}
?>
