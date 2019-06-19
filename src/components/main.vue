<!-- eslint-disable -->
<template>
  <div id="main" class="drop container-fluid p-0">
    <div id="content" class="row-fuild justify-content-center">
      <nav class="navbar fixed-top navbar-light p-1 col-12">
        <autocomplete :zoom="zoomAdress" :flashResult="showResultAnimation"/>
      </nav>
      <vuemap/>
      <div class="row-fluid col-12 p-0">
        <toc/>
      </div>
      <logo/>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import vuemap from './vuemap.vue';
import autocomplete from './autocomplete.vue';
import logo from './logo.vue';
import toc from './toc.vue';

export default {
  name: 'vuemain',
  components: {
    vuemap,
    autocomplete,
    logo,
    toc,
  },
  data() {
    return {
      // search adress result's zoom level      
      zoomAdress: 11,
      // animation or geopin
      showResultAnimation: true
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
	/*background-color: rgba(26, 112, 175, 0.8);*/
  background-color: transparent;
}
</style>
