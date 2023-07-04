<template>
    <div id="map"></div>
</template>

<style scoped>

#map {
    height: 500px;
}

</style>

<script>
import leaflet from 'leaflet'
import { onMounted } from 'vue';

export default {
    
    setup() {
        let map;

        onMounted(() => {
            map = leaflet.map('map').setView([46.903990918040584, 8.258780023091239], 8);

            leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
        })
    }
}
</script>