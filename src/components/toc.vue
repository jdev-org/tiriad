<template>
  <div id="toc" :style="{display: isTocVisible()}" class="card col-12 col-md-5 col-xl-3 p-0">
    <div id="accordion">
      <!-- card 1-->
      <div class="card">
        <div class="heading card-header p-0" id="headingOne">
          <button
            class="btn btn-block btn-sm"
            data-toggle="collapse"
            data-target="#collapseOne"
            aria-expanded="true"
            aria-controls="collapseOne"
          >
            <i class="fa fa-layer-group"></i> Couches
          </button>
        </div>
        <div
          id="collapseOne"
          class="collapse"
          aria-labelledby="headingOne"
          data-parent="#accordion"
        >
          <div class="card-body">
            <ul id="layersList" class="list-group list-group-horizontal-sm">
              <li class="list-group-item col-12">
                <!-- layers options -->
                <div class="btn-group">
                  <button type="button" class="btn btn-sm">
                    <i class="fa fa-eye"></i>
                  </button>
                  <button type="button" class="btn btn-sm disabled">Title</button>
                  <button type="button" class="btn btn-sm">
                    <i class="fa fa-trash"></i>
                  </button>
                  <button type="button" class="btn btn-sm" style="display:none;">
                    <i class="fa fa-filter"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                    style="display:none;"
                  ></button>
                  <div class="dropdown-menu dropdown-menu-right" style="display:none;">
                    <button class="dropdown-item" type="button">Infos</button>
                    <button class="dropdown-item" type="button">Style</button>
                    <button class="dropdown-item" type="button">Interroger</button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <!-- card 2-->
      <div class="card">
        <div class="heading card-header p-0" id="headingTwo">
          <button
            class="btn btn-sm btn-block collapsed"
            data-toggle="collapse"
            data-target="#collapseTwo"
            aria-expanded="false"
            aria-controls="collapseTwo"
          >
            <i class="fa fa-file-import"></i> Importer
          </button>
        </div>
        <div
          id="collapseTwo"
          class="collapse"
          aria-labelledby="headingTwo"
          data-parent="#accordion"
        >
          <div class="card-body">
            <!-- drop files -->
            <p>
              Pour un géocodage CSV, le fichier doit au moins contenir les colonnes suivantes : <br>
              <i>nom, adresse, code_postal, ville</i>
            </p>
            <b-field>
              <b-upload v-model="dropFiles" multiple drag-drop @input="readUploadFile()">
                <section class="section">
                  <div class="content has-text-centered">
                    <p>
                      <b-icon icon="upload" size="is-small"></b-icon>
                    </p>
                    <p>Cliquer ou glisser un fichier CSV, JSON</p>
                  </div>
                </section>
              </b-upload>
            </b-field>
            <div class="form-group">
              <label for="srsForm">Sélectionner une projection :</label>
              <select class="form-control" id="srsForm" @input='setSelectedSrs'>                
                <option>EPSG:3857</option>
                <option>EPSG:4326</option>
                <option>EPSG:2154</option>
              </select>
            </div>
            <button
            onclick="window.open('https://adresse.data.gouv.fr/api')"
            data-toggle="tooltip" data-html="true" title="<em>Cliquer pour plus d'informations</em>"
            type="button" class="btn" ><i class="fas fa-info"></i></button>
            <!-- drop CSV file -->
            <div class="tags">
              <span v-for="(file, index) in dropFiles" :key="index" class="tag is-primary">
                {{file.name}}
                <button
                  class="delete is-small"
                  type="button"
                  @click="deleteDropFile(index)"
                ></button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import kebabCase from "lodash";
import Papa from "papaparse";
import GeoJSON from "ol/format/GeoJSON.js";
import VectorSource from "ol/source/Vector.js";
import VectorLayer from "ol/layer/Vector.js";
import createStyle from "vuelayers/lib/ol-ext";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import CircleStyle from "ol/style.js";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Icon from "ol/style/Icon";
import Text from "ol/style/Text";
import { transform } from "ol/proj";

// bootstrap tooltips
$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip(); 
});

export default {
  name: "toc",
  components: {},
  data() {
    return {
      dropFiles: [],
      jsonLayerName: "",
      jsonFeatures: "",
      uploadSrs: "EPSG:4326"
    };
  },
  methods: {
    /*
    * Fire when user select EPSG code
    */    
    setSelectedSrs: function(e) {
      this.uploadSrs = e.srcElement.value
    },
    /*
    * Manage to visibility
    */
    isTocVisible: function() {      
      return this.$store.state.displayToc;
    },
    /**
     * File reader
     */
    readFile(blob, callback) {
      var reader = new FileReader();
      reader.onload = callback;
      reader.readAsText(blob);
    },
    /**
     * Read csv to transform to geoJSON
     */
    csvToJsonPoints(name, crs, csvObject) {
      let app = this;
      // layer skeleton
      let geojsonLayer = {
        type: "FeatureCollection",
        crs: {
          type: "name",
          properties: {
            name: crs // ex: EPSG:4326
          }
        },
        features: []
      };

      // feature skeleton
      let feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: []
        }
      };

      // get columns name
      let colName = csvObject[0];
      csvObject.splice(0, 1);

      // parse attributes values
      csvObject.forEach(function(line, v) {
        let properties = {};
        line.forEach(function(attribute, i) {
          let name = colName[i].replace(" ", "_");
          properties[name] = attribute;
        });
        // clone feature skeleton
        if (properties.longitude && properties.latitude) {
          let newFeature = JSON.parse(JSON.stringify(feature));
          // create new feature
          newFeature.properties = properties;
          let x = properties.longitude.replace(".", ",");
          x = parseFloat(properties.longitude);
          let y = properties.latitude.replace(".", ",");
          y = parseFloat(properties.latitude);
          newFeature.geometry.coordinates.push(x);
          newFeature.geometry.coordinates.push(y);
          // add feature to layer
          geojsonLayer.features.push(newFeature);
        }
      });
      let srs = geojsonLayer.crs.properties.name ? geojsonLayer.crs.properties.name : ''
      this.displayJson(geojsonLayer, true, srs)
    },
    /**
     * From csv read as String, transform it as file and post it to get geocoding values
     */
    csvToApi(csvString, fileName) {
      const requestBody = new FormData();
      let app = this;
      requestBody.append("delimiter", ";");
      requestBody.append(
        "data",
        new Blob([csvString], { type: "text/csv; charset=urf-8" }),
        "upload.csv"
      );
      fetch("https://api-adresse.data.gouv.fr/search/csv/", {
        method: "POST",
        body: requestBody
      })
        .then(res => res.text())
        .then(text => {
          let csvParsed = Papa.parse(text);
          fileName = fileName.replace(".csv", "");
          app.csvToJsonPoints(fileName, "EPSG:4326", csvParsed.data);
        });
    },
    /**
     * Reproject features array
     */
    reprojectFeatures(featuresArray, srs) {
      let reprojFeatures = [];
      featuresArray.forEach(function(f){
        f.getGeometry().transform(srs,'EPSG:3857')
        reprojFeatures.push(f)
      });
      return reprojFeatures  
    },
    /**
     * From json object, reproject features and add them to map as vector layer
     */
    displayJson (geojsonObject, toReproj, srs) {
      let features = (new GeoJSON()).readFeatures(geojsonObject)
      // reproject features
      if(srs){
        features = this.reprojectFeatures(features, srs)
      } else {        
        features = this.reprojectFeatures(features, this.uploadSrs)
      }        
      // create new vector and source
      let vectorSource = new VectorSource({
        features: features
      })
      let vectorLayer = new VectorLayer({
        source: vectorSource
      })
      // add to map
      this.$store.state.map.addLayer(vectorLayer)
    },
    /**
     * Search and remove layer by name
     */
    removeLayer(layerName) {
      this.$store.commit("removeLayer", layerName);
    },
    /*
     * read json file
     */
    readJson(file,e) {
      let rg = new RegExp("[^.]+");
      let name = file.name.match(rg)[0];
      let content = ""
      let jsonFeatures = ""
      this.removeLayer(name);
      if (typeof e.target.result == "string") {
        content = JSON.stringify(e.target.result);
        let v = JSON.parse(content);
        jsonFeatures = JSON.parse(v);
        this.displayJson(jsonFeatures)              
      }
    },
    /**
     * Read upload file
     */
    readUploadFile() {
      let app = this;
      this.jsonLayerName = "";
      this.jsonFeatures = "";
      this.content = "";
      if (this.dropFiles.length > 0) {
        // fire read file        
        let file = app.dropFiles[app.dropFiles.length - 1]
        this.readFile(file, function(e) {
          if (file.name.indexOf("csv") < 0) {
            app.readJson(file,e)
          } else {
            app.csvToApi(e.target.result, app.dropFiles[0].name);
          }
        });
      }
    },
    /**
     * Clean droped files
     */
    deleteDropFile(index) {
      this.dropFiles.splice(index, 1);
    },
  }
};
</script>

<style>
/* TOC */
#toc {
  position: fixed;
  bottom: 0em;
}

.heading .btn {
  color: white !important;
  background-color: rgb(26, 112, 175, 0.8) !important;
  border-color: transparent;
  box-shadow: 0 2px 3px rgba(255, 255, 255, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.2);
}
</style>

