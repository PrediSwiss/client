<script setup>
import { RouterLink, RouterView } from 'vue-router'
import Controls from './components/Controls.vue'
</script>

<template>
  <header>
      <Controls />
  </header>

  <RouterView />
</template>

<style scoped>

</style>
