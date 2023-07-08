<template>
    <div class="info">
        <div id="map"></div>
        <div class="lateral">
            <div class="control">
                <div class="trip">
                    <button type="button" class="btn btn-primary" @click="switchControlsVisibity">Toggle trip planner</button>
                    <input type="number" class="form-control" placeholder="Time in minutes" aria-label="Time" id="tripTime" min="1" step="1">
                    <button type="button" class="btn btn-primary" @click="getPredictionTrip">Predict trip</button>
                </div>
                <button type="button" class="btn btn-primary" @click="toggleCounter">Toggle counter display</button>
            </div>
            <div v-if="info === 'general'" class="general">
                <h3>General information</h3>
                <p>Each blue circle corresponds to a counting station, you can zoom in and click on the circle to get more information about the counter.</p>
                <p>There are currently {{ counterSize }} counting stations.</p>
            </div>
            <div v-else-if="info === 'counter'" class="counter">
                <h3>Id of the counter : {{ actualCounter[0] }}</h3>
                <p>Line : {{ actualCounter[1] }}</p>
                <p>Latitude :  {{ actualCounter[2] }}</p>
                <p>Longitude : {{ actualCounter[3] }}</p>
            </div>
        </div>
    </div>
    <div class="alert alert-warning" role="alert" id="timeNotValid" v-if="showAlert">
        The time must be greater then 1
    </div>
</template>

<style scoped>

#map {
    flex: 1;
    width: 100vh;
    height: 100vh;
}

#timeNotValid {
    position:fixed; 
    bottom: 0px; 
    left: 0px; 
    width: 100%;
    z-index:9999; 
    border-radius:0px
}

.info {
    display: flex;
    flex-direction: row;
}

.control {
    height: 25vh;
}

.lateral {
    width: 50vh;
}

</style>

<script>
import leaflet from 'leaflet'
import 'leaflet-routing-machine'
import 'leaflet-control-geocoder'
import { onMounted, ref } from 'vue'
import axios from 'axios'

export default {
    data() {
        return {
            counter: [],
            countersMarker: [],
            counterSize: 0,
            isCounterDisplay: true,
            map: null,
            controls: null,
            isControlsDisplay: false,
            renderer: null,
            info: 'general',
            actualCounter: null,
            route: null,
            tripPredict: [],
            showAlert: false,
        }
    },
    methods: {
        toggleCounter() {
            for (var i in this.countersMarker)
                if (this.isCounterDisplay == true) {
                    this.countersMarker[i].remove()
                } else {
                    this.countersMarker[i].addTo(this.map)
                }
            this.isCounterDisplay = !this.isCounterDisplay
        },
        getCounter() {
            const path = 'http://localhost:5001/counter';
            axios.get(path)
            .then((res) => {
                for (var i in res.data)
                    this.counter.push(res.data[i])

                this.counterSize = Object.keys(this.counter[0]).length

                for (var i in this.counter[0])
                    this.countersMarker.push(this.addMarker(this.counter[0][i], this.counter[1][i], this.counter[2][i], this.counter[3][i]))
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

            return marker
        },
        showCounterDetails(id, lane, lat, long) {
            this.info = 'counter'
            this.actualCounter = [id, lane, lat, long]
        },
        getPredictionTrip() {
            const path = 'http://localhost:5001/trip';

            const time = document.getElementById('tripTime').value

            if (time < 1) {
                this.showAlert = true;
                setTimeout(() => {
                    this.showAlert = false;
                }, 5000);
            } else {
                axios.post(path, [this.route.coordinates, time])
                .then((res) =>  {
                    var latitudes = res.data['lat'];
                    var longitudes = res.data['long'];

                    for (var key in latitudes) {
                        if (latitudes.hasOwnProperty(key) && longitudes.hasOwnProperty(key)) {
                            var lat = latitudes[key];
                            var long = longitudes[key];
                            leaflet.marker([lat, long]).addTo(this.map);
                        }
                    }

                    for (var i in res.data[0]) {
                        this.tripPredict.push(res.data[0][i])
                    }
                })
                .catch((error) => {
                    console.error(error)
                })
            }
        },
        switchControlsVisibity() {
            if (this.isControlsDisplay == true) {
                this.map.removeControl(this.controls)
            } else {
                this.map.addControl(this.controls)
            }
            this.isControlsDisplay = !this.isControlsDisplay
        }
    },
    setup() {
        const map = ref(null);
        const controls = ref(null)
        const route = ref(null)

        onMounted(() => {
            map.value = leaflet.map('map', {preferCanvas: true}).setView([46.903990918040584, 8.258780023091239], 8);

            leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map.value);

            controls.value = leaflet.Routing.control({
                keepInView: true,
                autoRoute: true,
                routeWhileDragging: false,
                serviceUrl: 'http://127.0.0.1:5000/route/v1',
                createMarker: function() {return null; },
                geocoder: leaflet.Control.Geocoder.nominatim()
            }).on('routesfound', (e) => {
                route.value = e.routes[0]
            });
        })

        return {
            map,
            controls,
            route,
        }
    },
    created() {
        this.getCounter()
    }
}
</script>