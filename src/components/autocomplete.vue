<!-- eslint-disable -->
<template>
<div class='row col-12'>
  <b-autocomplete
    size="is-mobile"
    class="col-12 pr-0 col-sm-6 autocomplete-field"
    v-model="name"
    :data="data"
    :placeholder="placeHolder"
    field="label"
    :loading="isFetching"
    @input="getAsyncData"
    @select="displayResult"
  >
    <template slot-scope="props">{{ props.option.properties.label }}</template>
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
/* eslint-disable */
import { debounce, kebabCase } from 'lodash';
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
import Observable from 'ol/Observable';

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
      placeHolder: 'Rue des frères Tilly 22700, Perros-Guirec',
      data: [],
      isFetching: false,
      name: '',
      api: 'https://api-adresse.data.gouv.fr/search/?q=',
      layer: '',
      isDisplay: 'none',
    };
  },
  methods: {
    /**
     * Animation to display search adress result
     * @param map - ol.Map
     * @param feature - ol.Feature from autocompletion selection
     * @param source - ol.Source for result layer
     */
    flash(map, feature, source) {
      let app = this;
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
     * Remove result feature
     */
    removeFeature() {
      this.$store.commit('setSearchFeatures', {});
    },
    /**
     * Trigger when user select adress from results list
     * @param selected is the selected adress from list
     */
    displayResult(selected) {
      let map = this.$store.state.map;
      if (selected.geometry) {
        const xy = selected.geometry.coordinates;

        // create new feature if necessary
        const newFeature = new Feature({
          id: selected.properties.id,
          geometry: new Point(transform(xy, 'EPSG:4326', 'EPSG:3857')),
        });
        const iconStyle = new Style({
          image: new Icon({
            src: './img/geoPin.png',
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

        // chnage view
        map.getView().setZoom(this.zoom);
        map.getView().setCenter(transform(xy, 'EPSG:4326', 'EPSG:3857'));        
      }
    },
    /**
     * Request to search adress
     */
    getAsyncData: debounce(function () {
      // clear last results
      this.data = [];
      // start loader animation
      this.isFetching = true;
      const url = this.api + this.name;
      axios
        .get(url)
        // promise
        .then(({ data }) => {
          // load result to autocomplete form
          data.features.forEach(item => this.data.push(item));
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
</style>
