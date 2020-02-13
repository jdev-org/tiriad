
<template>
<div class='row col-12'>
  <b-autocomplete
    size="is-mobile"
    class="col-12 pr-0 col-sm-6 col-md-3 autocomplete-field"
    v-model="name"
    value="address"
    :data="data"
    :placeholder="placeHolder"
    :field="field"
    :loading="isFetching"
    @input="getAsyncData"
    @select="displayResult"
    id="autocomplete-box"
  >
  <template slot-scope="props">
    <span>
      {{ formatList(props.option.properties) }}
    </span>
  </template>

  </b-autocomplete>
  <button
    data-toggle="tooltip" data-html="true" title="<em>Cliquer pour effacer le résultat</em>"
    type="button"
    @click="clearLayer"
    class="col-12 col-sm-1 btn btn-lg btn-block p-0 m-0"
    :style="{ display: isDisplay}">
    <i class="far fa-times-circle btn-rm"></i>
  </button>

</div>
</template>
<script>
/* eslint-disable no-undef */
import { debounce } from 'lodash';
import axios from 'axios';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { transform } from 'ol/proj';
import Circle from 'ol/style/Circle';
import Stroke from 'ol/style/Stroke';
import { easeOut } from 'ol/easing';

// bootstrap tooltips
$(document).ready(() => {
  $('[data-toggle="tooltip"]').tooltip();
});

export default {
  name: 'autocomplete',
  props: {
    zoom: Number,
    flashResult: Boolean
  },
  data() {
    return {
      placeHolder:'Entrer une adresse...',
      data: [],
      isFetching: false,
      name: '',
      apiBan: 'https://api-adresse.data.gouv.fr/search/?limit=5&q=',
      apiPhoton: 'https://photon.komoot.de/api/?limit=5&q=',
      layer: '',
      isDisplay: 'none',
      field:'label',
      api: 'ban'
    };
  },
  methods: {
    formatList(props) {
      let response = props.label;
      if(this.api === 'photon') {
        response = ` 
          ${props.street ? props.street + ',':''} 
          ${props.city ? props.city : props.name},
          ${props.state ? props.state + ',':''}
          ${props.country ? props.country:''}
        `;
      }
      return response;
    },
    /**
     * Animation to display search adress result
     * @param map - ol.Map
     * @param feature - ol.Feature from autocompletion selection
     */
    flash(map, feature) {
      let duration = 3000;
      let start = new Date().getTime();
      function animate(event) {
        let vectorContext = event.vectorContext;
        let frameState = event.frameState;
        let flashGeom = feature.getGeometry().clone();
        let elapsed = frameState.time - start;
        let elapsedRatio = elapsed / duration;
        // radius will be 5 at start and 30 at end.
        let radius = easeOut(elapsedRatio) * 25;
        let opacity = easeOut(1 - elapsedRatio);

        let flashStyle = new Style({
            image: new Circle({
                radius: radius,
                snapToPixel: false,
                stroke: new Stroke({
                    color: 'rgba(255, 0, 0, ' + opacity + ')',
                    width: 3,
                    opacity: opacity
                })
            })
        });
        vectorContext.setStyle(flashStyle);
        vectorContext.drawGeometry(flashGeom);
        // tell OL to continue postcompose animation
        map.render();
      }
      map.on('postcompose', animate);      
    },
    /**
     * Remove all layer's features
     */
    clearLayer() {
      this.layer.getSource().clear();
      this.isDisplay = 'none';
      this.name = '';
    },
    /**
     * Create layer use by autocomplet component to display result
     */
    createLayer() {
      if (this.$store.state.map) {
        const app = this;
        const vectorLayer = new VectorLayer({
          source: new VectorSource(),
          map: app.$store.state.map,
          addToToc: false,
          name:'searchLayer'
        });
        this.$store.state.map.addLayer(vectorLayer);
        this.layer = vectorLayer;
      }
    },
    /**
    * Convert string coordinates to real array
    * @param val - string to array
    * return coordinate array readable by openLayers
    */
    xyStringToArray(val) {
        let arrXY;
        if(val.replace(/\s/g, '').length > 0) {
            let splitCenter = val.split(',');
            let x = parseFloat(splitCenter[0]);
            let y = parseFloat(splitCenter[1]);
            arrXY = [x,y];
            return  arrXY;
        }
    },
    /**
     * Trigger when user select adress from results list
     * @param selected is the selected adress from list
     */
    displayResult(selected) {
      if(selected) {
        let map = this.$store.state.map;
        let xy;
        let preprojectGeom;
        xy = selected.geometry.coordinates;
        selected.label = this.api === 'photon' ? selected.properties.city : selected.properties.label;

        if(xy.length > 0) {
          preprojectGeom = new Point(transform(xy, 'EPSG:4326', 'EPSG:3857'));
        }
        if (preprojectGeom) {
          // create new feature if necessary
          const newFeature = new Feature({
            id: selected.properties ? selected.properties.id : '',
            geometry: preprojectGeom
          });
          const iconStyle = new Style({
            image: new Icon({
              src: './img/geoPin.png'
            }),
          });
          newFeature.setStyle(iconStyle);
          if (this.layer === '') {
            this.createLayer();
          }
          this.layer.getSource().clear();

          if(this.flashResult){
            this.flash(map,newFeature,this.layer.getSource());
          } else {
            this.layer.getSource().addFeature(newFeature);
            this.layer.getSource().refresh();
            this.isDisplay = '';
          }        

          // change view
          map.getView().setZoom(this.zoom);
          map.getView().setCenter(transform(xy, 'EPSG:4326', 'EPSG:3857'));

          // set value
          this.name = selected.label ? selected.label : '';
        }
      }
    },
    /**
     * Get param from config
     */
    getParam(param) {        
      let val = '';
      let config = this.$store.state && this.$store.state.config ? this.$store.state.config : '';
      if(config && config[param]) {
          val = config[param];
      }
      return val;
    },
    /**
     * Request to search adress
     */
    getAsyncData: debounce(function () {
      if(!this.name) { 
        // avoid to fire request if nothing was input
        return;
      }
        let url;
      // clear last results
      this.data = [];
      // start loader animation
      this.isFetching = true;
      // get api name to use from input. ex : ban/paris or photon/paris.
      let text = this.name.split('/');
      let request = text.length > 1 ? text[1] : text[0];
      this.api = text.length > 1 ? text[0] : this.getParam('search');
      if(this.api === "photon") {
        url =  this.apiPhoton + request;
      } else {
        url = this.apiBan + request;
      }
      axios
        .get(url)
        // promise
        .then(({ data }) => {
          // load result to autocomplete form
          if(data.features) { 
            data.features.forEach(item => this.data.push(item));
          }
          // stop loader animation
          this.isFetching = false;
        })
        // promise fail
        .catch((error) => {
          // stop loader animation
          this.isFetching = false;
          throw error;
        });
    }, 500),
  },
};
</script>

<style>
.autocomplete-field .input {
  /*box-shadow: rgba(26, 112, 175, 0.4) 0px 0px 0px 1.5px;*/
  border-color: rgba(0, 0, 0, 0.3);
  border-radius: 0px;
}

.autocomplete-field .input:active,
.autocomplete-field .input:focus {
  border-color: rgba(26, 112, 175, 0.7);
}

.btn-rm {
  color: white;
  box-shadow: white 0px 1px 2px 0px;
  border-radius: 15px;
  background-color: red;
  font-size: 24px;
}

.dropdown-menu{
  margin:0 !important;
  padding:0 !important;
}
</style>
