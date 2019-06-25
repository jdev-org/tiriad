/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import Vue from 'vue';
import Vuex from 'vuex';
import VueLayers from 'vuelayers';
import Buefy from 'buefy';
import Papa from 'papaparse';
import 'jquery';
import 'popper.js';
import 'bootstrap';
import App from './App.vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'vuelayers/lib/style.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { store } from './store/store.js';

Vue.use(VueLayers);
Vue.use(Buefy);
Vue.use(Papa);
Vue.component('font-awesome-icon', FontAwesomeIcon);
window.$ = require('jquery');
window.JQuery = require('jquery');
Vue.config.productionTip = false;

new Vue({
  el: '#app',
  store,
  components: { App },
  template: '<App/>'
})
