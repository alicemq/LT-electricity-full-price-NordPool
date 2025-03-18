<script setup>
import { computed, ref, onMounted } from 'vue';
import { formatPriceHours, isCurrentHour } from '../services/timeService';
import { calculatePrice } from '../services/priceCalculationService';

const props = defineProps({
  priceData: {
    type: Array,
    required: true,
    default: () => []
  }
});

const settings = ref({
  numberOfHours: 12,
  isDarkTheme: false,
  currentHourSize: 48,
  otherHourSize: 24
});

onMounted(() => {
  const savedSettings = localStorage.getItem('upcomingPricesSettings');
  if (savedSettings) {
    settings.value = JSON.parse(savedSettings);
  }
});

const saveSettings = () => {
  localStorage.setItem('upcomingPricesSettings', JSON.stringify(settings.value));
};

const upcomingPrices = computed(() => {
  const currentTime = new Date();
  return props.priceData
    .filter(price => new Date(price.timestamp) >= currentTime)
    .slice(0, settings.value.numberOfHours);
});

const themeClass = computed(() => {
  return settings.value.isDarkTheme ? 'bg-dark text-light' : 'bg-light text-dark';
});
</script>

<template>
  <div class="container-fluid">
    <!-- Settings Panel -->
    <div class="card mb-3">
      <div class="card-header">
        <h5 class="card-title">Display Settings</h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Number of hours</label>
            <input 
              type="number" 
              class="form-control" 
              v-model="settings.numberOfHours"
              @change="saveSettings"
              min="1" 
              max="24"
            >
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch mt-4">
              <input 
                class="form-check-input" 
                type="checkbox" 
                v-model="settings.isDarkTheme"
                @change="saveSettings"
              >
              <label class="form-check-label">Dark theme</label>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Current hour font size (px)</label>
            <input 
              type="number" 
              class="form-control" 
              v-model="settings.currentHourSize"
              @change="saveSettings"
              min="12" 
              max="72"
            >
          </div>
          <div class="col-md-6">
            <label class="form-label">Other hours font size (px)</label>
            <input 
              type="number" 
              class="form-control" 
              v-model="settings.otherHourSize"
              @change="saveSettings"
              min="12" 
              max="72"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Prices Display -->
    <div :class="['card', themeClass]">
      <div class="card-body">
        <div class="row g-4">
          <div 
            v-for="price in upcomingPrices" 
            :key="price.timestamp"
            class="col-12 text-center"
          >
            <div 
              :style="{
                fontSize: `${isCurrentHour(price.timestamp) ? settings.currentHourSize : settings.otherHourSize}px`
              }"
            >
              {{ calculatePrice(price) }} ct/kWh
              <small class="text-muted d-block">
                ({{ formatPriceHours(price.timestamp, 1) }})
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
