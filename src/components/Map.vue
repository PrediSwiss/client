<template>
    <div class="info">
        <div id="map">
            <div class="mapControl">
                <button type="button" class="btn" :class="{ 'btn-secondary': !isTripPlannerPressed, 'btn-primary': isTripPlannerPressed }" @click="switchControlsVisibity">Toggle trip planner</button>
                <button type="button" class="btn" :class="{ 'btn-secondary': !isCounterPressed, 'btn-primary': isCounterPressed }" @click="toggleCounter">Toggle counting station</button>
                <button type="button" class="btn" :class="{ 'btn-secondary': !isCurrentTrafficPressed, 'btn-primary': isCurrentTrafficPressed }" @click="toggleCurrent">Toggle current trafic</button>
                <button type="button" class="btn" :class="{ 'btn-secondary': !isPredictPressed, 'btn-primary': isPredictPressed }" @click="togglePredict" :hidden="isTripPredict">Toggle predict</button>
            </div>          
        </div>
        <div class="lateral">
            <div class="general">
                <h3>General information</h3>
                <p>Each blue circle correspond to a counting station, you can zoom in and click on the circle to get more information about the counting station.</p>
                <p>There are currently {{ counterSize }} counting stations.</p>
            </div>
            <div class="control">
                <div class="trip">
                    <h3>Predict a trip</h3>
                    <p>You first need to select a route and select a date for the prediction, the operation will take some minutes. The format used for the date is UTC. </p>                    
                    <div>
                        <label>Date :</label>
                        <input type="date" v-model="tripSelectedDate">
                        <label>Time :</label>
                        <input type="time" v-model="tripSelectedTime">
                    </div>
                    <button type="button" class="btn btn-success" @click="getPredictionTrip" :disabled="!isInputDataComplete">Predict trip</button>
                    <div class="spinner-border" role="status" v-if="isLoading">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
            <div v-if="info === 'counter'" class="counter">
                <h3>Id of the counting station : {{ actualCounter[0] }}</h3>
                <p>Line observed : {{ actualCounter[1] }}</p>
                <p>Latitude of the station : {{ actualCounter[2] }}</p>
                <p>Longitude of the station : {{ actualCounter[3] }}</p>
            </div>
            <div v-else-if="info === 'predict'" class="predict">
                <h3>Prediction of trafic</h3>
                <p>Id : {{ tripPredictDetails[0] }}</p>
                <p>Time of the prediction :  {{ timeTripRequest }} </p>
                <p>Speed predicted : <span v-if="!tripPredictDetails[2] ">No data</span><span v-else>{{ tripPredictDetails[2] }} km/h</span></p>
            </div>
            <div v-else-if="info === 'current'" class="current">
                <h3>Actual traffic</h3>
                <p>Counter id : {{ currentDetails[0] }} </p>
                <p>Date of data : {{ currentDetails[1] }} UTC</p>
                <p>Speed: <span v-if="currentDetails[2] === null">No data</span><span v-else>{{ currentDetails[2] }}</span></p>
            </div>
        </div>
    </div>
</template>

<style scoped>

#map {
    flex: 1;
    width: 100vh;
    height: 100vh;
    border-right: 5px solid #000000;
}

.info {
    display: flex;
    flex-direction: row;
}

.control {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.control > * {
    margin-bottom: 10px;
}

.control input {
    margin-right: 15px;
}

#map > * {
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 999;
}

.mapControl > * {
    margin-left: 10px;
    margin-bottom: 10px;
}

.trip > * {
    display: flex;
    margin-bottom: 15px;
}

label {
    margin-right: 10px;
}

.lateral {
    width: 50vh;
    margin-right: 10px;
    margin-left: 10px;
}

.general,
.control {
    border-bottom: 2px solid #706969;
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
            info: '',
            actualCounter: null,
            route: null,
            tripPredict: null,
            tripCounter: [],
            actualPredict: null,
            actualTime: null,
            predictMarker: [],
            showAlert: false,
            currentMarker: [],
            currentDetails: null,
            currentData: [],
            tripSelectedDate: '',
            tripSelectedTime: '',
            tripPredictDetails: null,
            predictDetails: [],
            isPredictDisplay: true,
            timeTripRequest: '',
            isLoading: false,
            isTripPlannerPressed: false,
            isCounterPressed: true,
            isCurrentTrafficPressed: false,
            isPredictPressed: false
        }
    },
    computed: {
        isInputDataComplete() {
            // Check if the required trip input data is complete
            const currentDateUTC = new Date().toISOString().split('T')[0];
            const currentTimeUTC = new Date().toISOString().split('T')[1].slice(0, 5);

            const selectedDateTimeUTC = `${this.tripSelectedDate}T${this.tripSelectedTime}`;

            return (
                this.tripSelectedDate &&
                this.tripSelectedTime &&
                this.route !== null &&
                this.isLoading === false &&
                selectedDateTimeUTC >= `${currentDateUTC}T${currentTimeUTC}`
            );
        },
        isTripPredict() {
            return this.predictDetails.length == 0
        }
    },
    methods: {
        getIdFromCounter(id) {
            // Find the key from the counter object based on the provided id
            for (const key in this.counter[3]) {
                if (this.counter[3].hasOwnProperty(key) && this.counter[3][key] === id) {
                    return key;
                }
            }
            return null;
        },
        toggleCurrent() {
            // Toggle the display of current traffic markers
            const path = 'http://localhost:5001/current';
            this.isCurrentTrafficPressed = !this.isCurrentTrafficPressed;

            if (this.currentMarker.length != 0) {
                // Remove existing current traffic markers from the map
                for (var i in this.currentMarker) {
                    this.currentMarker[i].remove()
                }
                this.currentMarker = []
                this.currentData = []
            } else {
                // Fetch current traffic data and add markers to the map
                axios.get(path)
                .then((res) => {
                    for (var id in res.data['id']) {
                        var counterId = this.getIdFromCounter(res.data['id'][id])
                        if (counterId != null) {
                            this.currentData.push([res.data['id'][id], res.data['publication_date'][id], res.data['speed_12'][id], res.data['flow_11'][id], this.counter[0][counterId], this.counter[1][counterId]])
                        }
                    }

                    for (var i in this.currentData) {
                        this.currentMarker.push(this.addMarkerSpeed(this.currentData[i][4], this.currentData[i][5], this.currentData[i][0], this.currentData[i][1], this.currentData[i][2], this.showCurrentDetails))
                    }
                })
                .catch((error) => {
                    console.error(error)
                })
            }
        },
        addMarkerSpeed(lat, long, id, date, speed, showFn) {
            // Add a circle marker to the map with specified properties
            const marker = leaflet.circleMarker([lat, long]).addTo(this.map)

            marker.on('click', () => {
                showFn(id, date, speed);
            });

            if (speed < 60) {
                marker.setStyle({color: 'orange'})
            } else if (!speed) {
                marker.setStyle({color: 'black'})
            } else {
                marker.setStyle({color: 'green'})
            }

            return marker
        },
        showCurrentDetails(id, date, speed) {
            // Update the info and currentDetails properties for displaying current details
            this.info = 'current'
            this.currentDetails = [id, date, speed]
        },
        toggleCounter() {
            // Toggle the display of counter markers on the map
            this.isCounterPressed = !this.isCounterPressed;
            for (var i in this.countersMarker)
                if (this.isCounterDisplay == true) {
                    this.countersMarker[i].remove()
                } else {
                    this.countersMarker[i].addTo(this.map)
                }
            this.isCounterDisplay = !this.isCounterDisplay
        },
        getCounter() {
            // Fetch counter data and add counter markers to the map
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
            // Add a circle marker for counter data to the map
            const marker = leaflet.circleMarker([lat, long]).addTo(this.map)

            marker.on('click', () => {
                this.showCounterDetails(id, lane, lat, long);
            });

            return marker
        },
        showCounterDetails(id, lane, lat, long) {
            // Update the info and actualCounter properties for displaying counter details
            this.info = 'counter'
            this.actualCounter = [id, lane, lat, long]
        },
        togglePredict() {
            // Toggle the display of predict markers on the map
            this.isPredictPressed = !this.isPredictPressed;
            for (var i in this.predictMarker)
                if (this.isPredictDisplay == true) {
                    this.predictMarker[i].remove()
                } else {
                    this.predictMarker[i].addTo(this.map)
                }
            this.isPredictDisplay = !this.isPredictDisplay
        },
        getPredictionTrip() {
            // Fetch trip and prediction data based on the selected route
            this.isLoading = true;
            const path = 'http://localhost:5001/tripPredict';
            const pathCounter = 'http://localhost:5001/trip'
            this.timeTripRequest = this.tripSelectedDate + "-" + this.tripSelectedTime

            this.predictDetails = []
            for (var i in this.predictMarker) {
                this.predictMarker[i].remove()
            }
            this.predictMarker = []

            //get the id of the counter that are on the route
            axios.post(pathCounter, [this.route.coordinates])
            .then((res) => {
                this.tripCounter = res.data
                //get the predictions for the counter selected
                axios.post(path, [this.tripCounter['id'], this.tripSelectedDate, this.tripSelectedTime])
                .then((res) =>  {
                    this.tripPredict = res.data
                    var latitudes = this.tripCounter['lat'];
                    var longitudes = this.tripCounter['long'];

                    var counter = 0
                    for (var key in latitudes) {
                        if (latitudes.hasOwnProperty(key) && longitudes.hasOwnProperty(key)) {
                            var lat = latitudes[key];
                            var long = longitudes[key];

                            this.predictDetails.push([lat, long, this.tripCounter['id'][key], new Date(this.tripPredict.time).toISOString(), this.tripPredict.predict[counter]])
                        }
                        counter += 1
                    }

                    for (var i in this.predictDetails) {
                        this.predictMarker.push(this.addMarkerSpeed(this.predictDetails[i][0], this.predictDetails[i][1], this.predictDetails[i][2], this.predictDetails[i][3], this.predictDetails[i][4], this.showPredictDetails))
                    }

                    this.isLoading = false;
                })
                .catch((error) => {
                    console.error(error)
                })
            })
            .catch((error) => {
                console.error(error)
            })
        },
        showPredictDetails(id, date, speed) {
            // Update the info and tripPredictDetails properties for displaying prediction details
            this.info = 'predict'
            this.tripPredictDetails = [id, date, speed]
        },
        switchControlsVisibity() {
            // Toggle the visibility of routing controls
            this.isTripPlannerPressed = !this.isTripPlannerPressed;
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
            // Initialize the map and routing controls
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
        // Retrieve counter data when the component is created
        this.getCounter()
    }
}
</script>