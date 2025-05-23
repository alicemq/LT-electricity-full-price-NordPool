<script setup>
import { RouterLink } from 'vue-router'
import PriceSettings from '../components/PriceSettings.vue';
</script>

<template>
  <div class="settings-page container">
    <h1 class="mb-3">Settings</h1>
    <PriceSettings />
    <div class="settings card">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Cheap Price Threshold (ct/kWh)</label>
          <input type="number" class="form-control" v-model="settings.cheapThreshold" step="0.1" min="0">
        </div>
        <div class="mb-3">
          <label class="form-label">Expensive Price Threshold (ct/kWh)</label>
          <input type="number" class="form-control" v-model="settings.expensiveThreshold" step="0.1" min="0">
        </div>
        <div class="mb-3">
          <label class="form-label">Price Ranges from Average (%)</label>
          <div class="sliders-container">
            <div class="mb-3">
              <label class="form-label text-muted">Cheap below</label>
              <div class="range-container">
                <input type="range" class="form-range" v-model.number="settings.cheapRange" min="0" max="100" step="1">
              </div>
              <span class="badge bg-primary">{{ settings.cheapRange }}%</span>
            </div>
            
            <div class="mb-3">
              <label class="form-label text-muted">Expensive above</label>
              <div class="range-container">
                <input type="range" class="form-range" v-model.number="settings.expensiveRange" min="0" max="100" step="1">
              </div>
              <span class="badge bg-primary">{{ settings.expensiveRange }}%</span>
            </div>
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
        cheapRange: 15,
        expensiveRange: 15
      }
    }
  },
  watch: {
    settings: {
      handler(newSettings) {
        localStorage.setItem('priceSettings', JSON.stringify(newSettings))
      },
      deep: true
    }
  },
  created() {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('priceSettings')
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings)
    }
  }
}
</script>

<style scoped>
.settings-page {
  padding: 1rem;
}
.settings {
  max-width: 600px;
  margin: 0 auto;
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
  padding: 10px 0;
}

.range-track {
  position: absolute;
  width: 100%;
  height: 2px;
  background: #ddd;
  top: 50%;
  transform: translateY(-50%);
}

.range-slider {
  position: absolute;
  width: 100%;
  pointer-events: all;
  appearance: none;
  height: 2px;
  background: transparent;
  top: 50%;
  transform: translateY(-50%);
}

.range-slider::-webkit-slider-thumb {
  pointer-events: auto;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0d6efd;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0,0,0,0.4);
}

.range-slider:focus {
  outline: none;
}

.range-slider.range-cheap {
  z-index: 1;
}
.range-slider.range-expensive {
  z-index: 2;
}

.range-values {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.sliders-container {
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-group label {
  font-size: 0.9em;
  color: #666;
}

.slider-group span {
  text-align: center;
  font-weight: bold;
}

.range-container {
  padding: 15px 0;
}
</style>
