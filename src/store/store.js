/* eslint-disable */
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    map: {},
    vuelayers: [],
    zoomAdress: 11,
    displayToc: 'none',
    tocLayers:[]
  },
  mutations: {
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
      let addLayer = layer.getProperties() && layer.getProperties().addToToc === false ? false : true
      if(addLayer) {
        state.tocLayers.push(layer);
        console.log(layer.getProperties().name)
      }
    },
    /**
         * Remove actual list of TOC layers and replace by all layers find in map
         * @param {Object} state 
         * @param {Array} layers from map
         */
    updateToc(state, layers) {
      state.tocLayers = [];
      // keep empty to clean toc
      if(layers.length > 0){
        layers.forEach(function(layer) {
          state.tocLayers.push(layer);
        });
      }
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
  },
});
