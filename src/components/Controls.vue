<template>
  <div class="controls">
    <div class="actual">
      <p>Etat actuel des routes</p>
      <button type="button" class="btn btn-primary" @click="getActualData">Trafic actuel</button>
    </div>
    <div class="future">
      <form class="d-flex">
        <input class="form-control me-2" type="search" placeholder="Estimation du trafic dans x secondes" aria-label="Search">
        <button class="btn btn-outline-success" type="submit">Afficher</button>
      </form>
    </div>
    <div class="trip">
      <form class="d-flex">
        <input class="form-control me-2" type="start" placeholder="Lieu de départ" aria-label="start">
        <input class="form-control me-2" type="end" placeholder="Lieu d'arrivé" aria-label="end">
        <input class="form-control me-2" type="search" placeholder="Estimation du trafic dans x secondes" aria-label="Search">
        <button class="btn btn-outline-success" type="submit">Afficher</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
</style>

<script>
export default {
  methods: {
    getActualData() {
    }
  },
  created() {
  }
}
  
</script>
