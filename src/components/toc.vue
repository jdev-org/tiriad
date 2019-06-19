<!-- eslint-disable -->
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
            <ul id="layersList" class="list-group">
              <li class="list-group-item col-12" v-for="layer in layers" :key="layer.id" >
                <!-- layers options -->                
                <div class="btn-group">
                  <button type="button" class="btn btn-sm py-0 px-2" @click="displayLayer" :value="layer.getProperties().id">
                    <i class="fa fa-eye"></i>
                  </button>                  
                  <button type="button" class="btn btn-sm py-0 px-2" @click="destroyLayer" :value="layer.getProperties().id">
                    <i class="fa fa-trash" activate="false"></i>
                  </button>
                  <button type="button" class="btn btn-sm py-0 px-2" @click="zoomToLayer" :value="layer.getProperties().id">
                    <i class="fas fa-glasses" activate="false"></i>
                  </button>                  
                  <!--div-- class="dropdown-menu dropdown-menu-right">
                    <button class="dropdown-item" type="button">Infos</button>
                    <button class="dropdown-item" type="button">Style</button>
                    <button class="dropdown-item" type="button">Vue 3D</button>
                    <button class="dropdown-item" type="button">Sélection</button>                    
                    <button class="dropdown-item" type="button">Table attributaire</button>
                  </!--div-->
                  <p class="pl-2 m-0">{{layer.getProperties().name}}</p>                  
                  <!--button
                    type="button"
                    class="btn btn-sm dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"                    
                  ></button-->                  

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
          <div class="card-body overflow-auto">
            <!-- drop files -->
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="geocodage" id="geocodCheckbox" @change="displayGeocodPanel">
              <label class="form-check-label" for="geocodCheckbox">
                Localiser des coordonnées
              </label>
            </div>
            <div class="form-group">
              <div class="form-check">
                <input class="form-check-input" :checked= "checkboxChecked" type="checkbox"  id="importProjCheck" @change="displayImportProjList">
                <label class="form-check-label" for="importProjCheck">
                  Ce fichier est dans une projection différente
                </label>
              </div>               
              <select :style="{display: displayImportProj}" class="form-control" id="srsForm" @input='setSelectedSrs'>                
                <option>EPSG:3857</option>
                <option>EPSG:4326</option>
                <option>EPSG:2154</option>
              </select>
            </div>      
            <p id="geocodText" :style="{display: isGeocodage}">
              Pour localiser un fichier CSV, le fichier doit au moins contenir les colonnes suivantes : <br>
              <i>Adresse (1), Code Postal, Ville</i>
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
            <button
            onclick="window.open('https://adresse.data.gouv.fr/api')"
            data-toggle="tooltip" data-html="true" title="<em>Cliquer pour plus d'informations</em>"
            type="button" class="btn" ><i class="fas fa-info"></i></button>
            <!-- drop CSV file -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable */
import axios from 'axios';
import kebabCase from 'lodash';
import Papa from 'papaparse';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { createStyle } from 'vuelayers/lib/ol-ext';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import CircleStyle from 'ol/style.js';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import { transform } from 'ol/proj';
import Cluster from 'ol/source/Cluster';

// bootstrap tooltips
$(document).ready(() => {
  $('[data-toggle="tooltip"]').tooltip();
});

export default {
  name: 'toc',
  components: {},
  data() {
    return {
      dropFiles: [],
      jsonLayerName: '',
      jsonFeatures: '',
      uploadSrs: 'EPSG:3857',
      map: this.$store.state.map,
      layers: this.$store.state.tocLayers,
      isGeocodage: '',
      geocodeData: true,
      mapProjection: 'EPSG:3857',
      displayImportProj: 'none',
      checkboxChecked: false
    };
  },
  methods: {
    createClientClusterStyle() {
      let cache = {};
      return function(feature){
        const size = feature.get('features').length;
        let style = cache[size];
        const sizeRules = function (size) {
          if (size === 1) {
            return 10;
          } if (size > 1 && size < 16) {
            return 15;
          } if (size > 15 && size < 31) {
            return 20;
          } if (size > 30 && size < 40) {
            return 25;
          }
          return 30;
        };  
        
        if (!style) {
          if (size > 1) {
            style = createStyle({
              imageRadius: sizeRules(size), // default 10,
              strokeColor: '#fff',
              fillColor: 'rgba(234, 49, 8, 1)',
              text: size.toString(),
              textFillColor: '#fff',
              opacity: 0.5,
            });
          } else {
            style = new Style({
              image: new Icon({
                src: './img/star-orange-red-gmap.png',
                scale: 0.4
            }),
          });
          }
          cache[size] = style;
        }
        return style;
      }
    },
    /**
     * Zoom to a given layer extent
     * @param e - event
     */         
    zoomToLayer(e) {
      let isBtn = e.target.type == "button" ? true : false;
      let layerId = isBtn ? e.target.value : e.target.parentElement.value;
      let map = this.$store.state.map;
      // remove li container
      if(layerId){
        let src = this.getLayerById(layerId).getSource();
        if(src && src.getExtent){
          let extent = src.getExtent();
          map.getView().fit(extent, map.getSize());
        } else {
          // TODO : create v-if when button is create to hide zoom to layer action if not available.
          alert("Cette action n'est pas disponible pour cet élément.");
        }        
      }
    },
    /**
     * Display projection select list
     * @param e - event
     */      
    displayImportProjList(e) {      
      if (e && this.displayImportProj) {
        document.getElementById('srsForm').style.display = e.target && e.target.checked ? '' : 'none';
      } else {
        document.getElementById('geocodCheckbox').checked = false;
        document.getElementById('srsForm').style.display = 'none';
      }
    },
    /**
     * Display or hide geocode informations
     * @param e - event
     * @param msg - optionnal message to display into alert panel
     */        
    displayGeocodPanel(e, msg) {
      if(e && this.isGeocodage === '') {
        // do not geocode data
        this.geocodeData = e.target && e.target.checked ? false : true;
        this.isGeocodage = e.target && e.target.checked ? 'none' : '';
      } else {
        // geocode data
        document.getElementById('geocodCheckbox').checked = false;
        this.isGeocodage = '';
        this.geocodeData = true;
      }
      if(msg) {
        alert(msg);
      }      
    },
    /**
     * Remove a given by id
     * @param id - layer id
     */       
    removeLayerById(id) {
      // remove layer
      this.$store.state.map.removeLayer(this.getLayerById(id));
    },
    getLayerByName(name){
      let findLayer;
      let layers = this.$store.state.map.getLayers().array_;
      layers.forEach(function(layer){        
        if(name === layer.get('name')){
          findLayer = layer;
        }
      });
      return findLayer      
    },
    /**
     * Return layer
     * @param id - search layer id
     */    
    getLayerById(id) {
      let findLayer;
      let layers = this.$store.state.map.getLayers().array_;      
      layers.forEach(function(layer){        
        if(id === layer.get('id')){
          findLayer = layer;
        }
      });
      return findLayer;
    },
    /**
     * Use to destroy layer and remove layer from TOC
     * @param e - event
     */
    destroyLayer(e) {
      let isBtn = e.target.type == "button" ? true : false;
      let layerId = isBtn ? e.target.value : e.target.parentElement.value;
      // remove layer
      this.removeLayerById(layerId);
      // remove directly layer into store. VueJs bind this action into toc and remove layer container automaticaly.
      this.$store.commit("removeTocLayer",layerId);
    },
    /**
     * Use to manage layer visibility and associate icon
     * @param e - event
     */
    displayLayer(e) {
      // get icon element
      let isBtn = e.target.type == "button" ? true : false;
      let domEl = isBtn ? e.target.firstChild : e.target;
      // change layer visiblity
      let layerId = isBtn ? e.target.value : e.target.parentElement.value;
      if(layerId){
        let layer = this.getLayerById(layerId);
        if(layer.getVisible()){
          domEl.className="far fa-eye-slash"
          layer.setVisible(false)
        } else {
          domEl.className="fas fa-eye"
          layer.setVisible(true)
        }
      }
    },
    /*
    * Fire when user select EPSG code
    */
    setSelectedSrs(e) {
      this.uploadSrs = e.srcElement.value;
    },
    /*
    * Manage to visibility
    */
    isTocVisible() {
      return this.$store.state.displayToc;
    },
    /**
     * File reader
     */
    readFile(blob, callback) {
      const reader = new FileReader();
      reader.onload = callback;
      reader.readAsText(blob);
    },
    /**
    * save file
    */
    saveFile(features, filename){
      
      var writer = new ol.format.GeoJSON();
      var geojsonStr = writer.writeFeatures(features);
      
      const requestBody = new FormData();
      requestBody.append('filename', filename);
      requestBody.append('data', new Blob([geojsonStr], { type: 'json; charset=urf-8' }),'filename.geojson');    
      fetch('/data.php', {
        method: 'POST',
        body: requestBody,
      }).then(res => res.text()).then((text) => {
          // TODO
        });
    },
    /**
     * Transform csv as object to geojson
     */
    csvToJsonPoints(fileName, csvObject, crs) {      
      const app = this;
      fileName = fileName.replace('.csv', '');      
      // layer skeleton
      const geojsonLayer = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: crs ? crs : this.uploadSrs, // ex: EPSG:4326
          },
        },
        features: [],
      };

      // feature skeleton
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      };

      // get columns name
      const colName = csvObject[0];
      csvObject.splice(0, 1);
      // find coordinates fields
      let x,y;
      colName.forEach(function(col) {
        switch (col.toLowerCase()) {
          case 'x':
            x = col;
            break;
          case 'lon':
            x = col;
            break; 
          case 'longitude':
            x = col;
            break;
          case 'y':
            y = col;
            break;        
          case 'lat':
            y = col;
            break;                    
          case 'latitude':
            y = col;
            break;             
          default:
            break;
        }                    
      });
      // parse attributes values
      csvObject.forEach((line, v) => {
        const properties = {};
        line.forEach((attribute, i) => {
          const name = colName[i].replace(' ', '_');
          properties[name] = attribute;
        });
        
        // clone feature skeleton
        if (properties[x] && properties[y] && properties[x] != undefined && properties[y] != undefined) {
          const newFeature = JSON.parse(JSON.stringify(feature));
          // create new feature
          newFeature.properties = properties;
          let pX = properties[x];
          let pY = properties[y]
          pX = pX ? pX.replace(',', '.') : '';
          pY = pY ? pY.replace(',', '.') : '';
          pX = parseFloat(pX);
          pY = parseFloat(pY);                    
          newFeature.geometry.coordinates.push(pX);
          newFeature.geometry.coordinates.push(pY);
          // add feature to layer
          geojsonLayer.features.push(newFeature);
        }
      });
      fileName = fileName.replace(' ','');
      //save file to server
      saveFile(geojsonLayer.features, fileName);
      this.displayJson(geojsonLayer, geojsonLayer.crs.properties.name, fileName, true);
    },
    /**
     * From csv read as String, transform it as file and post it to get geocoding values
     */
    csvToApi(csvString, fileName) {
      const requestBody = new FormData();
      const app = this;
      requestBody.append('delimiter', ';');
      requestBody.append(
        'data',
        new Blob([csvString], { type: 'text/csv; charset=urf-8' }),
        'upload.csv',
      );
      requestBody.append('columns', 'Adresse (1)');
      requestBody.append('columns', 'Code Postal');
      requestBody.append('columns', 'Ville');      
      fetch('https://api-adresse.data.gouv.fr/search/csv/', {
        method: 'POST',
        body: requestBody,
      })
        .then(res => res.text())
        .then((text) => {
          const csvParsed = Papa.parse(text);
          fileName = fileName.replace('.csv', '');
          app.csvToJsonPoints(fileName, csvParsed.data, 'EPSG:4326');
        });
    },
    /**
     * Reproject features array
     */
    reprojectFeatures(featuresArray, srs) {
      let app = this;
      const reprojFeatures = [];
      featuresArray.forEach((f) => {
        f.getGeometry().transform(srs, this.mapProjection);
        reprojFeatures.push(f);
      });
      return reprojFeatures;
    },
    /**
     * From json object, reproject features and add them to map as vector layer
     */
    displayJson(geojsonObject, srs, layerName, isCsv) {
      let app = this;
      // get features from geojson object
      let features = (new GeoJSON()).readFeatures(geojsonObject);
      // reproject features
      let standardSrs = this.mapProjection != this.uploadSrs ? this.uploadSrs : this.mapProjection;
      if (srs) {
        features = this.reprojectFeatures(features, srs);
      } else if(this.uploadSrs != this.mapProjection){
        features = this.reprojectFeatures(features, standardSrs);
      }      
      // create new vector and source
      let vectorSource = new VectorSource({
        features
      });
      // create clustered vector
      if(isCsv){
        vectorSource = new Cluster({
          source: vectorSource,
          distance: 50,
        })
      }      
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        name: layerName,
        addToToc: true,
        id: layerName,
        style: app.createClientClusterStyle()
      });

      // remove layer if already exist
      let existLyr = this.getLayerByName(layerName);
      if(existLyr) {
        let id = existLyr.getProperties().id
        this.removeLayerById(id);
        this.$store.commit("removeTocLayer",id);
      }
      // add to map
      this.$store.state.map.addLayer(vectorLayer);
      let lenLayers =  app.$store.state.map.getLayers().array_.length;
    },
    /**
     * Search and remove layer by name
     */
    removeLayer(layerName) {
      this.$store.commit('removeLayer', layerName);
    },
    /*
     * read json file
     */
    readJson(file, e) {
      const rg = new RegExp('[^.]+');
      const name = file.name.match(rg)[0];
      let content = '';
      let jsonFeatures = '';
      this.removeLayer(name);
      if (typeof e.target.result === 'string') {
        content = JSON.stringify(e.target.result);
        const v = JSON.parse(content);
        jsonFeatures = JSON.parse(v);
        this.displayJson(jsonFeatures,this.uploadSrs, name, false);
        this.displayGeocodPanel(false, "Le fichier n'est pas au format CSV, il n'a pas été géocodé.");
      }
    },
    /**
     * Read upload file
     */
    readUploadFile() {
      const app = this;
      this.jsonLayerName = '';
      this.jsonFeatures = '';
      this.content = '';
      if (this.dropFiles.length > 0) {
        // fire read file
        const file = this.dropFiles[this.dropFiles.length - 1];
        this.readFile(file, (e) => {
          if (file.name.indexOf('csv') < 0) {
            app.readJson(file, e);
          } else if (app.geocodeData) {
            app.csvToApi(e.target.result, file.name);
          } else {
            app.csvToJsonPoints(file.name, Papa.parse(e.target.result).data);
          }
        });
      }
      this.dropFiles = [];
    },
  },
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
