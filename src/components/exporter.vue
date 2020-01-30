<!--Pop up to display some informations-->
<template>
<!-- Modal -->

<div class="card">
    <!--CARD HEADER-->
    <div class="heading card-header p-0" id="exporterHeader">
        <button
            class="btn btn-block btn-sm"
            data-toggle="collapse"
            data-target="#exporter"
            aria-expanded="true"
            aria-controls="exporter">
            <i class="fas fa-file-export"></i> Exporter
        </button>
    </div>
    <!--COLLAPSIBLE-->
    <div class="collapse" id="exporter" aria-labelledby="exporterHeader" data-parent="#accordion">
        <!--CARD BODY-->
        <div class="card-body">
            <h6 class="pb-2">Sélectionner les données à exporter dans la liste :</h6>
            <!--LIST CONTENT-->
            <ul class="list-group list-group-flush">
                <li class="list-group-item"
                    v-for="layer in layers.filter(e => e.type === 'VECTOR')"
                    :key="layer.id">
                    <div class="custom-control custom-switch">
                        <input type="checkbox" class="custom-control-input exportLayers" :id="layer.getProperties().id" :value="layer.getProperties().id">
                        <label class="custom-control-label" :for="layer.getProperties().id">{{layer.getProperties().name}}</label>
                    </div>
                </li>
            </ul>
            <br>
            <input :placeholder="placeHolder" type="text" class="form-control" v-model="fileName">
        </div>
        <!--CARD FOOTER-->
        <div class="card-footer headerFooter p-2">
            <!--ACTIONS-->
            <div class="btn-group justify-content-center col-12" role="group">
                <!--DOWNLOAD-->
                <button type="button" @click="mergeLayers(0)" class="btn btn btn-outline-secondary btn-sm mt-2">
                    <i class="far fa-file-alt"></i> Obtenir
                </button>
                <!--SAVE FILE TO SERVER-->
                <button type="button" @click="mergeLayers(1)" class="btn btn btn-outline-secondary btn-sm mt-2">
                    <i class="far fa-paper-plane"></i> Envoyer
                </button>
            </div>
        </div>
    </div>
</div>
</template>
<script>
/* eslint-disable no-undef */
import {GeoJSON} from 'ol/format';
export default {
    name: 'exporter',
      data() {
        return {
            layers: this.$store.state.tocLayers,
            fileName:'',
            defaultFileName:'data',
            placeHolder:'Nommer le fichier...',
            actionFailMsg: 'Echec de l\'action, merci de contacter votre assistance.',
            noDataMsg: 'Aucunes informations à utiliser!'
        };
    },
    methods: {
        /**
         * Get layers id from input and merge layer as json to one
         */
        mergeLayers(actionNumber) {
            let selects = [];
            // get input html
            $(".exportLayers").each((i, selected) => {
                selects.push(selected);
            });
            // only checked
            selects = selects.filter(e=>e.checked);
            // get values array
            selects = selects.map(layer=>layer.value);
            let match = this.matchInputLayers(selects);
            let JSONLayer = this.manyToOneLayer(match);
            let name = this.fileName ? this.fileName : this.defaultFileName;

            if(!JSON.parse(JSONLayer).features.length) {
                $('#alertCloseBtn').trigger('click');
                $('#mainAlert>div').text(this.noDataMsg);
                $('#mainAlert').attr('class', "alert alert-dismissible fade alert-warning show");
                return
            }


            switch (actionNumber) {
                case 0:
                    this.downloadFile(JSONLayer, name);
                    break;
                case 1:
                    this.saveFile(JSONLayer, name);
                    break;
                default:
                    alert(actionFailMsg);
            }
        },
        /**
         * From toc layers, get only layers where ids match with input id
         * Input ids are create from layers id. If a layer exist in input, it's a vector mergeable layer
         */
        matchInputLayers(ids) {
            let layers = this.$store.state.tocLayers;
            return layers.filter(layer => ids.indexOf(layer.getProperties().id) > -1);
        },
        /**
         * Merge a list of layers features as unic JSON
         */
        manyToOneLayer(layers) {
            let features = [];
            // features to JSON
            layers.forEach(layer => {
                features = features.concat(layer.getSource().getFeatures());
            });
            return (new GeoJSON).writeFeatures(features);
        },
        /**
         * Save file to a specific path get from config
         */
        saveFile(geojson, fileName) {
            let app = this;
            let requestBody = new FormData();
            fileName += '.json';
            fileName = fileName.replace(/é/g, 'e');
            fileName = fileName.replace(/ /g, '_');
            requestBody.append('filename', fileName);
            requestBody.append('content', geojson);
            requestBody.append('wp', true);
            let request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if (request.readyState == 4 && request.status == 200 && request.responseText) {
                    let responseText = JSON.parse(request.responseText);
                    if(responseText && !responseText.success) {
                        // display error message into alert component
                        $('#alertCloseBtn').trigger('click');
                        $('#mainAlert>div').text(app.actionFailMsg);
                        $('#mainAlert').attr('class', "alert alert-dismissible fade alert-danger show");
                    }else{
                      // display error message into alert component
                      $('#alertCloseBtn').trigger('click');
                      $('#mainAlert>div').text('Fichier sauvegardé ' + responseText.filepath);
                      $('#mainAlert').attr('class', "alert alert-dismissible fade show");
                    }
                }
            }
            request.open('POST', './srv/storeData.php');
            request.send(requestBody);
        },
        /**
         * Download file to local computer directly
         */
        downloadFile(geojson, fileName) {
            let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(geojson);
            let tempHtmlLink = document.createElement('a');
            tempHtmlLink.setAttribute("href", dataStr);
            tempHtmlLink.setAttribute("download", fileName + ".json");
            document.body.appendChild(tempHtmlLink);
            tempHtmlLink.click();
            tempHtmlLink.remove();
        }
    }
};
</script>
<style scoped>
.selectBtn.active{
    border-color: white;
    background-color: #11991de0;
}
.headerFooter{
    border: none;
    background-color: transparent;
}
</style>
