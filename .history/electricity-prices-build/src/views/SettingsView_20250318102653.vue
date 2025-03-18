<script setup>
import PriceSettings from '../components/PriceSettings.vue';
</script>

<template>
  <div class="settings-page">
    <h1>Settings</h1>
    <PriceSettings />
    <RouterLink to="/" class="btn btn-primary">Back to Prices</RouterLink>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 1rem;
}
</style>
