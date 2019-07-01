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
    tocLayers:[],
    uploadFormat: null,
    style:{
      clientCluster: function() {
        let cache = {};
        return function(feature) {
          const size = feature.get('features').length;
          let style = cache[size];
          const sizeRules = function(size) {
            if (size === 1) {
              return 10;
            }
            if (size > 1 && size < 16) {
              return 15;
            }
            if (size > 15 && size < 31) {
              return 20;
            }
            if (size > 30 && size < 40) {
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
                opacity: 0.5
              });
            } else {
              style = new Style({
                image: new Icon({
                  src: './img/star-orange-red-gmap.png',
                  scale: 0.4
                })
              });
            }
            cache[size] = style;
          }
          return style;
        };
      }
    }
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
    setStyle(state,styleAsObj) {
      if(styleAsObj && styleAsObj.name && styleAsObj.style && !state.style[styleAsObj.name]) {
        state.style[styleAsObj.name] = styleAsObj.style;
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
    getStyle: state => state.style,
    getUploadFormat: state => state.uploadFormat
  },
});
