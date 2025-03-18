<script setup>
import { RouterLink } from 'vue-router'
import PriceSettings from '../components/PriceSettings.vue';
</script>

<template>
  <div class="settings-page">
    <div class="d-flex justify-content-between mb-3">
      <h1>Settings</h1>
      <RouterLink to="/" class="btn btn-primary">Back to Prices</RouterLink>
    </div>
    <PriceSettings />
  </div>
</template>

<style scoped>
.settings-page {
  padding: 1rem;
}
</style>
