<template>
    <div id="logo-brand" class="logo-org col-4 col-xs-6 col-sm-2 col-md-2 pr-0">
        <a ref="a" :href="getUrl('siteUrl')">
            <img :src="getUrl('logoUrl')">
        </a>
    </div>
</template>
<script>
/* eslint-disable no-undef */
export default {
  name: 'logo',
  methods: {
      /**
       * Return urls from config for logo and site when user click on logo
       */
      getUrl(type) {        
        let url = '';
        let config = this.$store.state && this.$store.state.config ? this.$store.state.config : '';
        if(config && config[type]) {
            url = config[type];
        }
        return url;
      }
  }
};
</script>
<style scoped>
.logo-org {
	position: fixed;
	bottom: 3%;
	right: 10px;
}

.logo-org img {
	max-width: 50%;
	height: auto;
	float: right;
}
</style>
