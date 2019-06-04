<!-- eslint-disable -->
<template>
  <div class="vuemap">
    <vl-map
      ref="map"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      data-projection="EPSG:4326"
      projection="EPSG:4326"
      class="vuemap align-self-start map"
      @mounted="onMapMounted"
    >
      <vl-view :zoom="getZoom()" :center="getCenter()" :rotation.sync="rotation"></vl-view>
      <!-- base layers -->
      <vl-layer-tile v-for="layer in baseLayers" :key="layer.name" :id="layer.name" :visible="layer.visible">
        <component :is="'vl-source-' + layer.name" v-bind="layer"></component>
      </vl-layer-tile>
      <!--// base layers -->

      <!-- other layers from config -->
      <component v-for="layer in initLayers" :is="layer.cmp" :if="layer.visible" :key="layer.id" v-bind="layer">
        <!-- add vl-source-* -->
        <component :is="layer.source.cmp" v-bind="layer.source">
          <!-- add static features to vl-source-vector if provided -->
          <vl-feature :if="layer.source.staticFeatures && layer.source.staticFeatures.length"
                      v-for="feature in layer.source.staticFeatures" :key="feature.id"
                      :id="feature.id" :properties="feature.properties">
            <component :is="geometryTypeToCmpName(feature.geometry.type)" v-bind="feature.geometry"></component>
          </vl-feature>

          <!-- add inner source if provided (like vl-source-vector inside vl-source-cluster) -->
          <component v-if="layer.source.source" :is="layer.source.source.cmp" v-bind="layer.source.source">
            <!-- add static features to vl-source-vector if provided -->
            <vl-feature :if="layer.source.source.staticFeatures && layer.source.source.staticFeatures.length"
                        v-for="feature in layer.source.source.staticFeatures" :key="feature.id"
                        :id="feature.id" :properties="feature.properties">
              <component :is="geometryTypeToCmpName(feature.geometry.type)" v-bind="feature.geometry"></component>
            </vl-feature>
          </component>
        </component>
        <!--// vl-source-* -->

        <!-- add style components if provided -->
        <!-- create vl-style-box or vl-style-func -->
        <component :if="layer.style" v-for="(style, i) in layer.style" :key="i" :is="style.cmp" v-bind="style">
          <!-- create inner style components: vl-style-circle, vl-style-icon, vl-style-fill, vl-style-stroke & etc -->
          <component :if="style.styles" v-for="(st, cmp) in style.styles" :key="cmp" :is="cmp" v-bind="st">
            <!-- vl-style-fill, vl-style-stroke if provided -->
            <vl-style-fill v-if="st.fill" v-bind="st.fill"></vl-style-fill>
            <vl-style-stroke v-if="st.stroke" v-bind="st.stroke"></vl-style-stroke>
          </component>
        </component>
        <!--// style -->
      </component>

    </vl-map>
    <div id="buttons-right" class="btn-group-vertical btn-action">
      <button type="button" @click="zoomIn" id="zoomInBtn" class="btn btn-sm btn-map">
        <i class="fas fa-plus"></i>
      </button>
      <button type="button" @click="zoomOut" id="zoomOutBtn" class="btn btn-sm btn-map">
        <i class="fas fa-minus"></i>
      </button>
      <button type="button" @click="overView" id="fullScreenBtn" class="btn btn-sm btn-map" data-toggle="tooltip" data-html="true" title="<em>Plan global</em>">
        <i class="fas fa-map"></i>
      </button>
      <button type="button" @click="displayToc" id="tocBtn" class="btn btn-sm btn-map" data-toggle="tooltip" data-html="true" title="<em>Gestion des couches</em>">
        <i class="fas fa-eye"></i>
      </button>
      <button type="button" @click="overView" id="toolsManagerBtn" class="btn btn-sm btn-map" data-toggle="tooltip" data-html="true" title="Boîte à outils (à venir)</em>">
        <i class="fas fa-tools"></i>
      </button>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import OverviewMap from 'ol/control/OverviewMap';
import {
  createProj, addProj, findPointOnSurface, createStyle,
} from 'vuelayers/lib/ol-ext';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import KML from 'ol/format/KML';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import GeoJSON from 'ol/format/GeoJSON.js';
import fromLonLat from 'ol/proj.js';
import axios from 'axios';
import kebabCase from 'lodash';
import Cluster from 'ol/source/Cluster'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'

// bootstrap tooltips
$(document).ready(() => {
  $('[data-toggle="tooltip"]').tooltip();
});

export default {
  name: 'vuemap',
  data() {
    return {
      visible: true,
      /* MAP */
      scale: 1,
      zoom: 6,
      center: [3.33357, 46.87760],
      rotation: 0,
      /* DEPRECATED */
      baseLayers: [],
      initLayers: [],
      /* CONTROLS */
      controls: {},
      firstLayer: [{
        format:'TILE',
        type: 'OSM',
        name: 'OpenStreetMap',
        id: this.getRandomId()
      },{
        id: this.getRandomId(),
        format: 'KML',
        url: './data/kml/regions_4326.kml',
        name: 'Régions',
        visible: true,
      },{
        id: this.getRandomId(),
        name: 'Départements',
        visible: true,
        url: './data/kml/departements_4326.kml',
        format: 'KML'
      },{
        id: this.getRandomId(),
        name: 'Point de distribution',
        format: 'KML',
        url: './data/kml/points_distribution.kml',
        visible: true,
        style: this.createDistribClusterStyle(),
        cluster: true,
        distance: 50        
      },{
        id: this.getRandomId(),
        name: 'Clients',
        format: 'GEOJSON',
        url: './data/geojson/clients_4326.geojson',
        visible: true,
        style: this.createClientClusterStyle(),
        cluster: true,
        distance: 50
      }],
    };
  },
  props: {
    msgTest: String,
  },
  methods: {
    /**
     * Manage TOC visibility
     */
    displayToc() {
      // this.tocIsVisible = this.tocIsVisible ? false : true;
      if (this.$store.state.displayToc === '') {
        this.$store.commit('setDisplayToc', 'none');
      } else {
        this.$store.commit('setDisplayToc', '');
      }
    },
    /**
     * @return zoom to update map view
     */
    getZoom() {
      if (this.zoom) {
        this.$refs.zoom = this.zoom;
        return this.$refs.zoom;
      }
      return 6;
    },
    /**
     * @return center as coordinates array to update view
     */
    getCenter() {
      if (this.center) {
        this.$refs.center = this.center;
        return this.$refs.center;
      }
      return [3.33357, 46.87760];
    },
    /**
     * generate random value as ID
     * @return Number
     */
    getRandomId() {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },
    /**
     * Return valid vl-geom-* to create VueLayers layer
     * @return VueLayers component
     */
    geometryTypeToCmpName(type) {
      return `vl-geom-${kebabCase(type.toLowerCase())}`;
    },
    /**
     * Display or hide overview map
     */
    overView() {
      const oldState = this.controls.overView.getCollapsed();
      const newState = !oldState;
      this.controls.overView.setCollapsed(newState);
    },
    /**
     * @return ol.Map from Vuex store
     */
    getMap() {
      return this.$refs.map.$map;
    },
    /**
     * Add ol.Map to store to be share between all components and give full access to ol.Map and others
     * ol.* elements
     */
    setMap(olMap) {
      if (this.$store && this.$store.state.map) {
        this.$store.commit('setMap', olMap);
      }
    },
    createDistribClusterStyle() {
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
              fillColor: 'rgba(234, 124, 8, 1)',
              text: size.toString(),
              textFillColor: '#fff',
              opacity: 0.5,
            });
          } else {
            style = new Style({
              image: new Icon({
                src: './img/star-orange-gmap.png',
                scale: 0.4
            }),
          });
          }
          cache[size] = style;
        }
        return style;
      }
    },
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
     * Create layer from given properties
     */
    createLayer(params) {
      let app = this;
      let formatFactory = null;
      switch (params.format) {
        case 'KML':
          formatFactory = new KML();
          break;
        case 'GEOJSON':
          formatFactory = new GeoJSON();
          break;
        case 'TILE':
          formatFactory = new TileLayer();
        default:
          null
      };
      // for basemap
      if(params.format === 'TILE' && params.type == 'OSM') {
        var raster = new TileLayer({
          source: new OSM(),
          name: params.name ? params.name : param.type + app.getRandomId(),
          id: params.id ? params.id : app.getRandomId()
        });
        return raster
      }
      // for vector sources
      let source = new VectorSource({
        url: params.url,
        format: formatFactory
      });
      // create clustered vector
      if(params.cluster && params.style && params.distance){
        source = new Cluster({
          source: source,
          distance: params.distance,
        })
      }
      let layer = new VectorLayer({
        source: source
      });
      if(params.style){        
        layer.setStyle(params.style)
      }
      let name = params.name ? params.name : '';
      let id = params.id ? params.id : '';
      layer.setProperties({
        'name':name,
        'id': id
      });
      layer.setVisible(params.visible);
      return layer;
    },
    /**
     * Fire when VueLayers Map is mounted after map init
     */
    onMapMounted() {
      const app = this;
      // get map from vue instance
      const map = this.getMap();

      if (map) {        
        // set map to global store
        this.setMap(map);
        // set default view context
        const { zoom } = this;        
        map.getView().animate({
          zoom,
        });        
        // now ol.Map instance is ready and we can work with it directly
        this.controls.overView = new OverviewMap({
          collapsed: true,
          collapsible: true,
        });
        map.getControls().extend([this.controls.overView]);
        // event to update TOC content and display new layers layers
        map.getLayers().on('add', function(e) {
          app.$store.commit('setLayerToToc', e.element)
          console.log(e.element);
        });

        this.firstLayer.forEach(function(p) {
          let newLayer = app.createLayer(p);
          map.addLayer(newLayer);
        });
      }
    },
    /**
     * Fire when user click in zoom out button
     */
    zoomOut() {
      const view = this.$refs.map.$map.getView();
      view.animate({ zoom: view.getZoom() - 1 });
    },
    /**
     * Fire when user click in zoom in button
     */
    zoomIn() {
      const view = this.$refs.map.$map.getView();
      view.animate({ zoom: view.getZoom() + 1 });
    },
  },
};
</script>

<style>
.vuemap {
  height: 100%;
}
/* DEFAULT MAP CONTROL */
.ol-control button {
  background-color: rgb(26, 112, 175, 1);
}

.ol-zoom {
  display: none;
}

.ol-overviewmap button {
  display: none !important;
}
/* NEW CONTROL */
.btn-action {
  position: fixed !important;
  top: 5em;
  left: 1.2em;
  background-color: rgba(26, 112, 175, 0.8);
}

.btn-map {
  color: white !important;
}

.btn-map:hover {
  background-color: white;
  color: rgba(26, 112, 175, 0.8) !important;
}
</style>
