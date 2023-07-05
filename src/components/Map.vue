<template>
    <div class="info">
        <div id="map"></div>
        <div v-if="info === 'general'" class="general">
            <h3>Informations general</h3>
            <p>Chaque cercle bleu correspond à un poste de comptage, vous pouvez zoomer et clicker sur le cercle pour avoir plus d'information sur le compteur</p>
            <p>Il y a actuellement {{ counterSize }} stations de comptages</p>
            <button type="button" class="btn btn-primary" @click="switchControlsVisibity">Test</button>
        </div>
        <div v-else-if="info === 'counter'" class="counter">
            <h3>Id du compteur : {{ actualCounter[0] }}</h3>
            <p>Ligne : {{ actualCounter[1] }}</p>
            <p>Latitude :  {{ actualCounter[2] }}</p>
            <p>Longitude : {{ actualCounter[3] }}</p>
        </div>
    </div>
</template>

<style scoped>

#map {
    height: 700px;
    width: 70%;
}

.info {
    display: flex;
    flex-direction: row;
}

.general {
    max-width: 30%;
}

.counter {
    max-width: 30%;
    text-align: left;
}

</style>

<script>
import leaflet from 'leaflet'
import 'leaflet-routing-machine';
import 'leaflet-control-geocoder'
import { onMounted, ref } from 'vue';
import axios from 'axios';

export default {
    data() {
        return {
            counter: [],
            counterSize: 0,
            map: null,
            controls: null,
            renderer: null,
            info: 'general',
            actualCounter: null
        }
    },
    methods: {
        getCounter() {
            const path = 'http://localhost:5001/counter';
            axios.get(path)
            .then((res) => {
                for (var i in res.data)
                    this.counter.push(res.data[i])

                this.counterSize = Object.keys(this.counter[0]).length

                for (var i in this.counter[0])
                    this.addMarker(this.counter[0][i], this.counter[1][i], this.counter[2][i], this.counter[3][i])
            })
            .catch((error) => {
                console.error(error)
            })
        },
        addMarker(lat, long, lane, id) {
            const marker = leaflet.circleMarker([lat, long]).addTo(this.map)

            marker.on('click', () => {
                this.showCounterDetails(id, lane, lat, long);
            });
        },
        showCounterDetails(id, lane, lat, long) {
            this.info = 'counter'
            this.actualCounter = [id, lane, lat, long]
        },
        switchControlsVisibity() {
            if (this.controls) {
                this.map.removeControl(this.controls);
                this.controls = null;
            } else {
                this.controls = leaflet.Routing.control({
                show: true,
                geocoder: leaflet.Control.Geocoder.nominatim(),
                }).addTo(this.map);
            }
        }
    },
    setup() {
        const map = ref(null);
        const controls = ref(null)

        onMounted(() => {
            map.value = leaflet.map('map', {preferCanvas: true}).setView([46.903990918040584, 8.258780023091239], 8);

            leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map.value);

            controls.value = leaflet.Routing.control({
                show: true,
                geocoder: leaflet.Control.Geocoder.nominatim()
            }).addTo(map.value);
        })

        return {
            map,
            controls,
        }
    },
    created() {
        this.getCounter()
    }
}
</script>