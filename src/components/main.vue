<template>
  <div id="main" class="drop container-fluid p-0">
    <div id="content" class="row-fuild justify-content-center">
      <nav class="navbar fixed-top navbar-light p-1 col-12">
        <autocomplete :zoom="zoomAdress" :flashResult="showResultAnimation"/>
      </nav>
      <vuemap :allowDragAndDropMap="activeDD"/>
      <div class="row-fluid col-12 p-0">
        <toc/>
      </div>
      <div class="row-fluid col-12 p-0">
        <alert/>
      </div>
      <logo/>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-undef */
import vuemap from './vuemap.vue';
import autocomplete from './autocomplete.vue';
import logo from './logo.vue';
import toc from './toc.vue';
import alert from './alert.vue';

export default {
  name: 'vuemain',
  components: {
    vuemap,
    autocomplete,
    logo,
    toc,
    alert
  },
  beforeCreate() {
    // get config from json file
    this.$store.commit('setConfig', "./config.json");
  },
  data() {
    return {
      // search adress result's zoom level      
      zoomAdress: 9,
      // animation or geopin
      showResultAnimation: false,
      // drag&drop from file to the map directly to display data
      activeDD: false,
    };
  },
  method: { // pass methods here
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#main, #content {
	height: 100%;
}
.navbar {
  background-color: transparent;
}
</style>
