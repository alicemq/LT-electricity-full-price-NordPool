<script setup>
import { RouterLink } from 'vue-router'
import PriceSettings from '../components/PriceSettings.vue';
</script>

<template>
  <div class="settings-page">
    <h1 class="mb-3">Settings</h1>
    <PriceSettings />
    <div class="text-center mt-4">
      <RouterLink to="/" class="btn btn-primary">Save and Close</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 1rem;
}
</style>
