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
          <label>Price Ranges from Average (%)</label>
          <small class="text-muted d-block">Prices below {{ settings.cheapRange }}% are cheap, above {{ settings.expensiveRange }}% are expensive</small>
          <div class="range-container">
            <input 
              type="range" 
              v-model="settings.cheapRange" 
              class="range-slider range-cheap" 
              min="0" 
              max="100" 
              step="1"
            >
            <input 
              type="range" 
              v-model="settings.expensiveRange" 
              class="range-slider range-expensive" 
              min="0" 
              max="100" 
              step="1"
            >
          </div>
          <div class="range-values">
            <span>{{ settings.cheapRange }}%</span>
            <span>{{ settings.expensiveRange }}%</span>
          </div>
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
        cheapRange: 35,
        expensiveRange: 65
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
.range-container {
  position: relative;
  height: 40px;
}

.range-slider {
  position: absolute;
  width: 100%;
  pointer-events: none;
  appearance: none;
  height: 2px;
  background: none;
}

.range-slider::-webkit-slider-thumb {
  pointer-events: auto;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0d6efd;
  cursor: pointer;
}

.range-values {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}
</style>
