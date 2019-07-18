<template>
  <div class="vuemap">
    <!-- Popup content-->
    <div>
    <div id="popover-content" class="card" style="display:none;">
      <div id="popover-text" class="card-body pb-0" style="padding-top: 10px;">        
        <p class="card-text">Will be replace by features infos.</p>
      </div>
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
      <a>
      <div>
      <button type="button" @click="overView" style="display:none" id="toolsManagerBtn" class="btn btn-sm btn-map" data-toggle="tooltip" data-html="true" title="Boîte à outils (à venir)</em>">
        <i class="fas fa-tools"></i>
      </button>
      </div>
      </a>
    </div>
  </div>
</template>
<script>
/* eslint-disable no-undef */
import OverviewMap from 'ol/control/OverviewMap';
import { kebabCase } from 'lodash';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
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
        format: 'KML',
      }],
      geolocCoordinates:{},
      popupCount: 0,
      fieldsPopup: []
    };
  },
  methods: {
    /**
     * Copy a string to clipboard
     */    
    copyPopoverContent() {
      let copyTest = document.queryCommandSupported('copy');
      if(copyTest && document.getElementById('popover-text') ) {
        let text = [];
        this.fieldsPopup.forEach(function(id) {
          if(id 
          && id != 'Type' 
          && document.getElementById(id).innerText 
          && text.indexOf(document.getElementById(id).innerText) < 0){
            text.push(document.getElementById(id).innerText);
          }
        });
        const textArea = document.createElement('textarea');
        textArea.value = text.join(', ');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    },
    /**
     * Get layers from file system
     * TODO : finish and test
     */
    initMapLayers() {
      let app = this;
      const req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if(req.status === 200 && req.readyState === 4 && req.responseText) {
          JSON.parse(req.responseText).forEach(function(file) {
            const rg = new RegExp('[^.]+');
            const name = file.name.match(rg)[0];
            let format = "GEOJSON";
            let layer = {
              id: app.getRandomId(),
              format: format,
              url: file.path,
              name: name,
              style: app.$store.state.style.featuresStyle(format)
            }
            let newLayer = app.createLayer(layer);            
            app.$store.state.map.addLayer(newLayer);
          });
        }
      };          
      req.open('POST', './php/getLayers.php', true);          
      req.send();
    },
    /**
     * Overlay content elements
     * @param e - event
     * @param popup - ol.overlay object
     */
    showOverlay(selectFeature, popup) {
      let app = this;
      this.fieldsPopup = [];
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
        document.getElementById('popover-text').innerHTML = textToDisplay ? textToDisplay : '<em>Aucune informations disponible.</em>';        
        // add content to popup import by popup content
        document.getElementById('popup-content').innerHTML = $('#popover-content').html();
        // Click event not worked if we add button directly in html card
        // So, we create the button to copy text here with jquery
        let btn = '<button style="float:right; color:rgba(26, 112, 175, 1);"' +
        'type="button" class="btn" data-toggle="tooltip" data-html="true" title="Copier le texte">' +
        '<i class="fas fa-copy"></i></button>';
        $('#popup-content').append(btn);
        $('#popup-content').on("click", "button", function(){
         app.copyPopoverContent();
        });
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
        let textContent = '';
        let value;
        Object.keys(props).forEach(function(propName) {
            if(typeof(props[propName]) != 'object' 
            && propName.indexOf('result') < 0 
            && propName != 'label'
            && propName != 'latitude' 
            && propName != 'longitude'
            && propName.indexOf('media') < 0
            && propName.indexOf('description') < 0 
            && propName.indexOf('style') < 0 ) {           
            let toFind =  ['Nom_1', 'Adresse_(1)', 'Ville', 'Code_Postal', 'Code_Catégorie'];            
            if(toFind.indexOf(propName) > -1) {
              let newName;
              switch (propName) {
                case "Adresse_(1)":
                  newName = "Adresse";
                  break;
                case 'Nom_1':
                  newName = 'Nom';
                  break;
                case 'Ville':
                  newName = 'Ville';
                  break;
                case 'Code_Postal':
                  newName = 'Code postal';
                  break;
                case 'Code_Catégorie':
                  newName = 'Type'
                  break;
                default:
                  newName = propName;
              }
              let newNameId = newName.replace(/ /g, '_');
              value = props[propName].toString();              
              textContent += controlText(textContent, '<strong>' + newName+ ': </strong><span id='+newNameId+'>' + value.toLowerCase()) + '</span>';
              app.fieldsPopup.push(newNameId);
            } else {
              // TODO - not duplicate
              let newPropName = propName.replace(/ /g, '_');
              value = props[propName].toString();
              textContent += controlText(textContent, '<strong>' + propName+ ': </strong><span id='+newPropName+'>' + value.toLowerCase()) + '</span>';
              app.fieldsPopup.push(newPropName);
            }
          }       
        });
        // check if adress exit in popover content
        if(textContent.indexOf('Adresse') < 0) {
          // clone object to transform cooridnates
          let coordinates = JSON.parse(JSON.stringify(position));
          // reproject coordinates for the ban API
          let newCoord = transform([coordinates[0], coordinates[1]], 'EPSG:3857', 'EPSG:4326');
          if(!isNaN(newCoord[0]) && !isNaN(newCoord[1])){
            // create request
            let params = 'lon='+newCoord[0]+'&lat='+newCoord[1];
            const http = new XMLHttpRequest();
            http.open('GET', 'https://api-adresse.data.gouv.fr/reverse/?' + params, true);
            // read request response
            http.onreadystatechange = function() {
              // SUCCESS
              if(http.status == 200 && http.responseText && JSON.parse(http.responseText).features.length > 0) {
                let props = JSON.parse(http.responseText).features[0].properties;
                // Adresse
                app.fieldsPopup.push("adresse");               
                textContent += controlText(textContent, '<strong>Adresse: </strong><span id="adresse">'+ props.name+'</span>');
                // post code
                app.fieldsPopup.push('postcode');
                textContent += controlText(textContent, '<strong>Code postal: </strong><span id="postcode">'+ props.postcode+'</span>');
                // city                
                app.fieldsPopup.push("city");
                textContent += controlText(textContent, '<strong>Ville: </strong><span id="city">'+ props.city+'</span>');
                addToPopover(textContent.replace('name', 'Nom'));
              } else {
                addToPopover(textContent);
              }
            };
            http.send();
          }
        } else {
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
        const rg = new RegExp('[^.]+');
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
      // click interaction working on 'click'
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
          // force 3857 projection by default
          formatFactory = new GeoJSON({'dataProjection':'EPSG:3857'});
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
        'name': name.replace(/_/g, ' '),
        'id': id
      });
      // set visibility if defined
      layer.setVisible(params.visible ? params.visible : true);
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
