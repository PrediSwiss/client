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
                <div class="currentControl">
                    <button type="button" class="btn btn-primary" @click="displayCurrent">Display current trafic</button>
                    <button type="button" class="btn btn-primary" @click="removeCurrent">Remove current trafic</button>
                </div>
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
            <div v-else-if="info === 'predict'" class="predict">
                <h3>Prediction of trafic</h3>
                <p>Speed predicted at time {{ actualTime }} : {{ actualPredict }} km/h</p>
            </div>
            <div v-else-if="info === 'current'" class="current">
                <h3>Actual traffic</h3>
                <p>Counter id : {{ currentDetails[0] }} </p>
                <p>Date of data : {{ currentDetails[1] }} UTC</p>
                <p>Speed : {{ currentDetails[2] }}</p>
                <p>Flow : {{ currentDetails[3] }}</p>
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
            tripCounter: [],
            actualPredict: null,
            actualTime: null,
            predictMarker: [],
            showAlert: false,
            currentMarker: [],
            currentDetails: [],
        }
    },
    methods: {
        getIdFromCounter(id) {
            for (const key in this.counter[3]) {
                if (this.counter[3].hasOwnProperty(key) && this.counter[3][key] === id) {
                    return key;
                }
            }
            return null;
        },
        removeCurrent() {
            if (this.currentMarker.length != 0) {
                for (var i in this.currentMarker) {
                    this.currentMarker[i].remove()
                }

                this.currentMarker = []
            }
        },
        displayCurrent() {
            const path = 'http://localhost:5001/current';

            this.removeCurrent()

            axios.get(path)
            .then((res) => {
                for (var id in res.data['id']) {
                    var counterId = this.getIdFromCounter(res.data['id'][id])
                    if (counterId != null) {
                        const marker = leaflet.circleMarker([this.counter[0][counterId], this.counter[1][counterId]]).addTo(this.map)

                        marker.on('click', () => {
                            this.showCurrentDetails(res.data['id'][id], res.data['publication_date'][id], res.data['speed_12'][id], res.data['flow_11'][id]);
                        });

                        if (res.data['speed_12'][id] < 60) {
                            marker.setStyle({color: 'orange'})
                        } else {
                            marker.setStyle({color: 'green'})
                        }

                        this.currentMarker.push(marker)
                    }
                }
            })
            .catch((error) => {
                console.error(error)
            })
        },
        showCurrentDetails(id, date, speed, flow) {
            this.info = 'current'
            this.currentDetails = [id, date, speed, flow]
        },
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
            const path = 'http://localhost:5001/tripPredict';
            const pathCounter = 'http://localhost:5001/trip'

            const time = document.getElementById('tripTime').value

            axios.post(pathCounter, [this.route.coordinates])
            .then((res) => {
                this.tripCounter = res.data

                if (time < 1) {
                    this.showAlert = true;
                    setTimeout(() => {
                        this.showAlert = false;
                    }, 5000);
                } else {
                    axios.post(path, [this.tripCounter['id'], time])
                    .then((res) =>  {
                        for (let i = 0; i < res.data.length; i++) {
                            this.tripPredict.push(res.data[i])
                        }

                        var latitudes = this.tripCounter['lat'];
                        var longitudes = this.tripCounter['long'];
                        const maxSpeed = Math.max(...this.tripPredict)
                        const minSpeed = Math.min(...this.tripPredict)
                        const rangeSpeed = maxSpeed - minSpeed

                        var counter = 0
                        for (var key in latitudes) {
                            if (latitudes.hasOwnProperty(key) && longitudes.hasOwnProperty(key)) {
                                var lat = latitudes[key];
                                var long = longitudes[key];
                                const marker = leaflet.circleMarker([lat, long]).addTo(this.map)

                                marker.on('click', () => {
                                    this.showPredictDetails(counter);
                                });
                                
                                if (rangeSpeed > 30 && this.tripPredict[counter] < maxSpeed - (rangeSpeed / 3)) {
                                    marker.setStyle({color: 'orange'})
                                } else {
                                    marker.setStyle({color: 'green'})
                                }

                                this.predictMarker.push(marker)
                            }
                            counter += 1
                        }
                    })
                    .catch((error) => {
                        console.error(error)
                    })
                }
            })
            .catch((error) => {
                console.error(error)
            })
        },
        showPredictDetails(id) {
            this.info = 'predict'
            this.actualPredict = this.tripPredict[id]
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