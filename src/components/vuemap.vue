<template>
  <div class="vuemap">
    <!-- Popup content-->
    <div id="popover-content" class="card" style="display:none;">
      <div id="popover-text" class="card-body" style="padding-top: 10px;">
        <h5 class="card-title">Special title treatment</h5>
        <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>
      </div>
    </div>  
    <!-- Popup container-->
    <popup class="p-0" id="popup"/> 
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
      <button type="button" @click="overView" style="display:none" id="toolsManagerBtn" class="btn btn-sm btn-map" data-toggle="tooltip" data-html="true" title="Boîte à outils (à venir)</em>">
        <i class="fas fa-tools"></i>
      </button>
    </div>
  </div>
</template>
<script>
/* eslint-disable no-undef */
import OverviewMap from 'ol/control/OverviewMap';
import { kebabCase } from 'lodash';
import { createStyle } from 'vuelayers/lib/ol-ext';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Cluster from 'ol/source/Cluster'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import Overlay from 'ol/Overlay';
import popup from './popup';
import Geolocation from 'ol/Geolocation';
import { transform } from 'ol/proj';
import { DragAndDrop } from 'ol/interaction';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from 'ol/format';

// bootstrap tooltips
$(document).ready(() => {
  $('[data-toggle="tooltip"]').tooltip();
});

export default {
  name: 'vuemap',
  components: {
    popup
  },
  props: {    
    allowDragAndDropMap: Boolean
  },  
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
        distance: 20
      },{
        id: this.getRandomId(),
        name: 'Clients',
        format: 'GEOJSON',
        url: './data/geojson/clients_4326.geojson',
        visible: true,
        style: this.createClientClusterStyle(),
        cluster: true,
        distance: 20
      }],
      geolocCoordinates:{},
      popupCount: 0
    };
  },
  methods: {
    /**
     * Get layers from file system
     * TODO : finish and test
     */
    initMapLayers(map) {
      let app = this;
      const req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if(req.status === 200 && req.readyState === 4 && req.responseText) {
          let response = req.responseText; 
          console.log(response);
          console.log(typeof(response));
          console.log(JSON.parse(response));
          response.forEach(function(file) {
            const rg = new RegExp("[^.]+");
            const name = file.name.match(rg)[0];
            let layer = {
              id: app.getRandomId(),
              format: 'GEOJSON',
              url: file.path,
              name: name,
              visible: true,
            }
            let newLayer = app.createLayer(layer);
            map.addLayer(newLayer);      
          });
        }
      };          
      req.open('POST', 'https://jdev.fr/tiriad/php/getLayers.php', true);          
      req.send();
    },
    /**
     * Overlay content elements
     * @param e - event
     * @param popup - ol.overlay object
     */
    showOverlay(selectFeature, popup) {  
      // control text to add into popover
      let controlText = function(content, textToInsert) {
        if(content.indexOf(textToInsert) < 0 && textToInsert != '') {
          let jumpLine = content != '' ? '</br>' : '';
          return jumpLine + textToInsert;
        } else {
          return '';
        }
      };
      // add to popover
      let addToPopover = function(textToDisplay) {
        // set content text to html template for this component
        document.getElementById('popover-text').innerHTML = textToDisplay ? textToDisplay : "<em>Aucune informations disponible.</em>";
        // add content to popup import by popup content
        document.getElementById('popup-content').innerHTML = $('#popover-content').html();
      };
      // get properties
      let props = selectFeature.getProperties();
      let hasPropsFeatures = props.hasOwnProperty('features');
      if(hasPropsFeatures || props) {
        // get feature to display        
        let feature = hasPropsFeatures ? selectFeature.getProperties().features[0] : selectFeature;
        let position = feature.getGeometry().getCoordinates();
        // locate popover
        popup.setPosition(position);
        let props = feature.getProperties();
        // create popup content
        let textContent = "";
        Object.keys(props).forEach(function(propName) {
          if(typeof(props[propName]) != "object" 
          && propName.indexOf('result') < 0 
          && propName != 'label'
          && propName != 'latitude' 
          && propName != 'longitude' 
          && propName.indexOf('style') < 0 ) {            
            let value = props[propName].toString();
            textContent += controlText(textContent, '<strong>' + propName+ ': </strong>' + value.toLowerCase());
          }
        });
        // check if adress exit in popover content
        if(textContent.indexOf("Adresse") < 0) {
          //let coordinates = feature.getGeometry().getCoordinates();
          // clone object to transform cooridnates
          let coordinates = JSON.parse(JSON.stringify(position));
          // reproject coordinates for the ban API
          let newCoord = transform([coordinates[0], coordinates[1]], 'EPSG:3857', 'EPSG:4326');
          // create request
          let params = 'lon='+newCoord[0]+'&lat='+newCoord[1];
          const http = new XMLHttpRequest();
          http.open('GET', 'https://api-adresse.data.gouv.fr/reverse/?' + params, true);
          // read request response
          http.onreadystatechange = function() {
            // SUCCESS
            if(http.status == 200 && http.responseText && JSON.parse(http.responseText).features.length > 0) {
              let props = JSON.parse(http.responseText).features[0].properties;
              textContent += controlText(textContent, '<strong>Adresse: </strong>' + props.name);
              textContent += controlText(textContent, '<strong>Code postal: </strong>' + props.postcode);
              textContent += controlText(textContent, '<strong>Ville: </strong>' + props.city);              
              addToPopover(textContent.replace('name', 'Nom'));
            } else {
              // FAIL
              addToPopover(textContent);
            }
          };
          http.send();
        } else {
          textContent = textContent.replace('Code_Categorie','Type');
          textContent = textContent.replace('Code_Postal','Code postal');          
          addToPopover(textContent);
        }        
      }
    },  
    /**
     * Start geolocation trackink
     */
    initGeoloc() {
      let app = this;
      let geolocation = new Geolocation({
        tracking: true
      });
      geolocation.on('change:position', function() {
        let p = geolocation.getPosition();
        app.geolocCoordinates.x = p[1];
        app.geolocCoordinates.y = p[0];        
      });
    },
    /**
     * Create ol.overlay and set overlay behavior
     * @return ol.overlay object as Bootstrap popover
     */
    createOverlay() {
      // popup content
      let popup = new Overlay({
        element: document.getElementById('popup'),
        id: 'popover',
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      });
      this.$store.state.map.addOverlay(popup);
      return popup;
    },
    /**
     * Add drag&drop interactions to display geo file on map
     * @param {Boolean} zoomToExtent
     */
    addDragAndDropInteraction(zoomToExent) {
      let map = this.$store.state.map;
      let app = this;
      // create interaction
      let dragAndDropInteraction  = new DragAndDrop({
        formatConstructors: [
          GPX,
          GeoJSON,
          IGC,
          KML,
          TopoJSON
        ]
      });
      // add interaction to map
      map.addInteraction(dragAndDropInteraction );
      // event behavior
      dragAndDropInteraction.on('addfeatures', function(event) {        
        const rg = new RegExp("[^.]+");
        const name = event.file.name.match(rg)[0];        
        const id = app.getRandomId();
        let vectorSource = new VectorSource({
          features: event.features
        });
        // remove layer from toc and map if already exist
        app.$store.commit('removeLayerByName', name);
        map.addLayer(new VectorLayer({
          renderMode: 'image',
          source: vectorSource,
          id: id,
          name: name
        }));
        if(zoomToExent) {
          map.getView().fit(vectorSource.getExtent());
        }        
      });      
    },
    /**
     * Add click interraction to display infos into overlay popover
     * @param popup - ol.overlay
     */
    addClickInteraction(popup) {
      // click interaction working on "click"
      let app = this;
      // event to hide or show popover
      this.$store.state.map.on('click', function(evt) {
        popup.setPosition(undefined);
        app.$store.state.map.forEachFeatureAtPixel(
            evt.pixel,
            function(ft){
              let properties = ft.getProperties();
              if(properties.features && properties.features.length < 2){
                app.showOverlay(ft, popup);
              } else if(properties){
                app.showOverlay(ft, popup);
              } else {
                popup.setPosition(undefined);
              }
              return ft;
            }
        );
      });      
    },    
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
          break;
        default:
          null
      }
      // for basemap
      if(params.format === 'TILE' && params.type == 'OSM') {
        var raster = new TileLayer({
          source: new OSM(),
          name: params.name ? params.name : params.type + app.getRandomId(),
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
      // start tracking      
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
          app.$store.commit('setLayerToToc', e.element);
        });          
        this.firstLayer.forEach(function(p) {
          let newLayer = app.createLayer(p);
          map.addLayer(newLayer);
        });        
        //this.initMapLayers(map);
        let popupInfo = this.createOverlay();
        this.addClickInteraction(popupInfo);
        // add drag&drop interaction
        if(this.allowDragAndDropMap){
          this.addDragAndDropInteraction(false);
        }
        // read files from data/layers
        this.initMapLayers();
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
