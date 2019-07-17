/* eslint-disable */
import Vue from 'vue';
import Vuex from 'vuex';
import {Style, Icon} from 'ol/style';

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    map: {},
    vuelayers: [],
    zoomAdress: 11,
    displayToc: 'none',
    tocLayers:[],
    uploadFormat: null,
    style:{
      featuresStyle: function(format) {
        return function(feature) {
          let val = feature.get('Code_Catégorie') ? feature.get('Code_Catégorie') : feature.get('styleUrl');
          let icon;
          let color = 'red';
          let path = './lib/icons/jdev/';
          if(format === 'KML' || val.indexOf('icon') >- 1) {
            color = 'orange';
            val = val.indexOf('icon-1502') < 0 ? 'CHR' : 'DET';
          }
          switch (val) {
            case 'DET':
              icon = 'store';
              break;
            case 'CHR':
              icon = 'restaurant';
              break;
            case 'ASS':
              icon = 'embassy';
              break;
            default:
              icon = 'other';
          };
          let style =  new Style({
            image: new Icon({
              src: path + icon + '-' + color + '.svg',
              scale: 0.8
            })
          });
          feature.setStyle(style);
        };
      }
    },
    firstLayersNames: []
  },
  mutations: {
    /**
     * Set format for the last file upload
     * @param {Object} state 
     * @param {String} format
     */
    setUploadFormat(state, format) {
      state.uploadFormat = format;
    },
    /**
     * setMap is use to share map
     * @param {Object} state
     * @param {ol.Map} olMap
     */
    setMap(state, olMap) {
      state.map = olMap;           
    },
    /**
     * setMap is use to add layers to map from array
     * @param {Object} state
     * @param {Array} layers as array taht contains layers
     */
    setLayer(state, layers) {
      layers.forEach((l) => {
        state.vuelayers.push(l);
      });
    },
    /**
     * Remove a given layer from map
     * @param {Object} state
     * @param {String} name of layer as String
     */
    removeLayer(state, name) {
      state.vuelayers.forEach((layer) => {
        if (layer.title == name) {
          state.vuelayers.splice(0, 1);
        }
      });
    },
    /**
     * Remove layer from map and TOC
     * @param {Object} state 
     * @param {*} id of layer to remove
     */
    removeLayerById(state, id) {      
      state.map.getLayers().array_.forEach(function(layer) {
        if (id === layer.get('id')) {
          state.map.removeLayer(layer);
          store.commit('removeTocLayer',id);
        }
      });
    },
    /**
     * Remove layer from map and TOC
     * @param {Object} state 
     * @param {String} name of layer to remove
     */
    removeLayerByName(state, name) {
      let store = this;      
      state.map.getLayers().array_.forEach(function(layer) {
        if (name === layer.get('name')) {
          let id = layer.get('id');
          state.map.removeLayer(layer);
          store.commit('removeTocLayer',id);
        }
      });
    },    
    /**
     * setMap is use to add layers to map from array
     * @param {Object} state
     * @param {Integer} val set zoom level
     */
    setZoom(state, val) {
      state.zoomAdress = val;
    },
    /**
     * setMap is use to add layers to map from array
     * @param {Object} state
     * @param {Boolean} bool as true to display toc component
     */
    setDisplayToc(state, bool) {
      state.displayToc = bool;
    },
    /** 
     * setLayerToToc is use to set new state of TOC visibility
     * @param {Object} state
     * @param {Boolean} bool
     */    
    setLayerToToc(state, layer) {
      // manage case where layer is not to insert in TOC by 'addToToc' property
      let addLayer = layer.getProperties() && layer.getProperties().addToToc === false ? false : true;
      if(addLayer) {        
        state.tocLayers.unshift(layer);
      }
    },
    removeTocLayer(state, layerId) {
      state.tocLayers.forEach(function(lyr,i){
        if(lyr.getProperties().id === layerId) {
          state.tocLayers.splice(i,1);
        }
      });
    },
    /**
     * Remove actual list of TOC layers and replace by all layers find in map
     * @param {Object} state 
     * @param {Array} layers from map
     */
    clearToc(state) {
      state.tocLayers = [];
      // keep empty to clean toc
      let layers = state.map.getLayers().array_;
      if(layers.length > 0){
        layers.forEach(function(layer) {
          if(layer.type == 'TILE' || (layer.getSource() && layer.getSource().getFeatures() && layer.getSource().getFeatures().length > 0)) {
            state.tocLayers.unshift(layer);            
          }
        });
      }
    },
    /**
     * 
     * @param {Object} state 
     * @param {ol.style} styleAsObj 
     */
    setStyle(state,styleAsObj) {
      if(styleAsObj && styleAsObj.name && styleAsObj.style && !state.style[styleAsObj.name]) {
        state.style[styleAsObj.name] = styleAsObj.style;
      }
    },
    /**
     * Layers name to ignore for side panel
     * @param {Object} state 
     * @param {Array} names 
     */
    setFirstLayers(state, names) {
      state = names;
    }
  },
  getters: {
    /**
     * @param {Object} state
     * All return asked from store
     */
    getMap: state => state.map,
    getLayers: state => state.vuelayers,
    getZoomAdress: state => state.zoomAdress,
    getDisplayToc: state => state.displayToc,
    getTocLayers: state => state.tocLayers,
    getStyle: state => state.style,
    getUploadFormat: state => state.uploadFormat,
    getfirstLayersNames: state => state.firstLayersNames
  },
});
