<template>
    <div id="test" class="row-fluid col-3">
        <div class="card">
            <div class="card-body p-2">
              <autocomplete :zoom="zoomAdress" :flashResult="showResultAnimation" class="col-12 p-0 m-0"/>
              <div class="form-check col-12" v-if="toIgnore.indexOf(layer.getProperties().name)<0" v-for="layer in layers" :key="layer.id">
                <input class="form-check-input" type="checkbox" value="" id="defaultCheck1">
                <label class="form-check-label" for="defaultCheck1">
                  {{layer.getProperties().name}}
                </label>
              </div>              
            </div>
        </div>
    </div>
</template>

<script>
/* eslint-disable no-undef */
import autocomplete from './autocomplete.vue';

export default {
  name: 'sidepanel',
  components: {
    autocomplete
  },
  data() {
    return {
      // search adress result's zoom level      
      zoomAdress: 9,
      // animation or geopin
      showResultAnimation: false,
      layers: this.$store.state.tocLayers,
      layersToIgnore: this.$store.state.firstLayersNames,
      toIgnore: ["Régions","OpenStreetMap","Départements"]
    };
  },
  method: { // pass methods here
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
#test {
  position: fixed;
  right: 0em;
  top:0em;
}
</style>