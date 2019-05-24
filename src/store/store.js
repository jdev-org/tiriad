import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

export const store = new Vuex.Store({
    state: {        
        map: {},
        layers: [],
        zoomAdress: 11,
        displayToc: 'none',
    },
    mutations: {
        /**
         * setMap is use to share map
         * @param state 
         * @param olMap 
         */
        setMap: function(state, olMap) {
            state.map = olMap
        },
        /**
         * setMap is use to add layers to map from array
         * @param state
         * @param layers as array taht contains layers
         */
        setLayer: function(state,layers) {
            layers.forEach(function(l){
                state.layers.push(l)
            })            
        },
        /**
         * Remove a given layer from map
         * @param state
         * @param name of layer as String
         */        
        removeLayer: function(state, name) {
            state.layers.forEach(function(layer){
                if(layer.title == name) {
                    state.layers.splice(0,1)
                  }
            })
        },
        /**
         * setMap is use to add layers to map from array
         * @param state
         * @param val set zoom level
         */        
        setZoom: function (state,val) {
            state.zoomAdress = val
        },
        /**
         * setMap is use to add layers to map from array
         * @param state
         * @param bool as true to display toc component
         */                
        setDisplayToc: function (state,bool) {
            state.displayToc = bool
        }
    },
    getters: {
        /**
         * @param state
         * All return asked from store
         */        
        getMap: state => state.map,
        getLayers: state => state.layers,
        getZoomAdress: state => state.zoomAdress,
        getDisplayToc: state => state.displayToc,
    }
})