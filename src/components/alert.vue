<!--Pop up to display some informations-->
<template>
    <div class="row mainAlert col-12 justify-content-center">
        <div id="mainAlert" class="alert alert-warning alert-dismissible fade" role="alert">
            <div></div>
            <button type="button" id="alertCloseBtn" class="close" onclick="$('#mainAlert').removeClass('show')" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    </div>
</template>
<script>
/* eslint-disable no-undef */
export default {
    name: 'alert',
};
</script>
<style scoped>
.mainAlert {
  position: fixed;
  top: 3em;
}
</style>
