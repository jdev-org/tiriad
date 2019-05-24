<template>
  <div id="app">
    <viewer/>
  </div>
</template>

<script>
import viewer from './components/main.vue';

export default {
  name: 'app',
  components: {
    viewer,
  },
};
</script>

<style>
#app, html, body {
  height: 100%;
}
</style>
