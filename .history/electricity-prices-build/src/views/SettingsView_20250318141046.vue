<script setup>
import { RouterLink } from 'vue-router'
import PriceSettings from '../components/PriceSettings.vue';
</script>

<template>
  <div class="settings-page">
    <h1 class="mb-3">Settings</h1>
    <PriceSettings />
    <div class="settings">
      <div class="settings-form">
        <div class="form-group">
          <label>Cheap Price Threshold (ct/kWh)</label>
          <input type="number" v-model="settings.cheapThreshold" step="0.1" min="0">
        </div>
        <div class="form-group">
          <label>Expensive Price Threshold (ct/kWh)</label>
          <input type="number" v-model="settings.expensiveThreshold" step="0.1" min="0">
        </div>
        <div class="form-group">
          <label>Price Range Percentage (%)</label>
          <input type="number" v-model="settings.percentageRange" step="1" min="1" max="100">
        </div>
      </div>
    </div>
    <div class="text-center mt-4">
      <RouterLink to="/" class="btn btn-primary">Save and Close</RouterLink>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  data() {
    return {
      settings: {
        cheapThreshold: 20,
        expensiveThreshold: 50,
        percentageRange: 15
      }
    }
  },
  created() {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('priceSettings')
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings)
    }
  },
  watch: {
    settings: {
      handler(newSettings) {
        localStorage.setItem('priceSettings', JSON.stringify(newSettings))
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.settings-page {
  padding: 1rem;
}
.settings {
  padding: 20px;
}
.settings-form {
  max-width: 400px;
  margin: 0 auto;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
