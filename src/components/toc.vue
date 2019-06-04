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
                  <button type="button" class="btn btn-sm py-0 px-2" style="display:none;">
                    <i class="fa fa-filter"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                    style="display:none;"
                  ></button><p class="pl-2 m-0">{{layer.getProperties().name}}</p>
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
              Pour un import CSV, le fichier doit au moins contenir les colonnes suivantes : <br>
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
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import createStyle from 'vuelayers/lib/ol-ext';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import CircleStyle from 'ol/style.js';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import { transform } from 'ol/proj';

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
      uploadSrs: 'EPSG:4326',
      map: this.$store.state.map,
      layers: this.$store.state.tocLayers,
    };
  },
  methods: {
    removeLayerById(id) {
      // remove layer
      this.$store.state.map.removeLayer(this.getLayerById(id));
    },
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
    destroyLayer(e) {
      let isBtn = e.target.type == "button" ? true : false;
      let layerId = isBtn ? e.target.value : e.target.parentElement.value;
      // remove layer
      this.removeLayerById(layerId);
      // remove li container
      e.target.closest("li").remove();
    },
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
     * Read csv to transform to geoJSON
     */
    csvToJsonPoints(fileName, crs, csvObject) {
      const app = this;
      // layer skeleton
      const geojsonLayer = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: crs, // ex: EPSG:4326
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

      // parse attributes values
      csvObject.forEach((line, v) => {
        const properties = {};
        line.forEach((attribute, i) => {
          const name = colName[i].replace(' ', '_');
          properties[name] = attribute;
        });
        // clone feature skeleton
        if (properties.longitude && properties.latitude) {
          const newFeature = JSON.parse(JSON.stringify(feature));
          // create new feature
          newFeature.properties = properties;
          let x = properties.longitude.replace('.', ',');
          x = parseFloat(properties.longitude);
          let y = properties.latitude.replace('.', ',');
          y = parseFloat(properties.latitude);
          newFeature.geometry.coordinates.push(x);
          newFeature.geometry.coordinates.push(y);
          // add feature to layer
          geojsonLayer.features.push(newFeature);
        }
      });
      const srs = geojsonLayer.crs.properties.name ? geojsonLayer.crs.properties.name : '';
      this.displayJson(geojsonLayer, srs, fileName);
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
      fetch('http://api-adresse.data.gouv.fr/search/csv/', {
        method: 'POST',
        body: requestBody,
      })
        .then(res => res.text())
        .then((text) => {
          const csvParsed = Papa.parse(text);
          fileName = fileName.replace('.csv', '');
          app.csvToJsonPoints(fileName, 'EPSG:4326', csvParsed.data);
        });
    },
    /**
     * Reproject features array
     */
    reprojectFeatures(featuresArray, srs) {
      const reprojFeatures = [];
      featuresArray.forEach((f) => {
        f.getGeometry().transform(srs, 'EPSG:3857');
        reprojFeatures.push(f);
      });
      return reprojFeatures;
    },
    /**
     * From json object, reproject features and add them to map as vector layer
     */
    displayJson(geojsonObject, srs, layerName) {
      let app = this;
      let features = (new GeoJSON()).readFeatures(geojsonObject);
      // reproject features
      if (srs) {
        features = this.reprojectFeatures(features, srs);
      } else {
        features = this.reprojectFeatures(features, this.uploadSrs);
      }
      // create new vector and source
      const vectorSource = new VectorSource({
        features
      });
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        name: layerName,
        addToToc: true,
        id: layerName
      });
      // add to map
      this.$store.state.map.addLayer(vectorLayer);
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
        this.displayJson(jsonFeatures,'', name);
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
        const file = app.dropFiles[app.dropFiles.length - 1];
        this.readFile(file, (e) => {
          if (file.name.indexOf('csv') < 0) {
            app.readJson(file, e);
          } else {
            app.csvToApi(e.target.result, app.dropFiles[0].name);
          }
        });
      }
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
