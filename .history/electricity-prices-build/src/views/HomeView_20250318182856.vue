<script setup>
import { ref, watch, computed } from 'vue'
import { RouterLink } from 'vue-router'
import moment from 'moment-timezone';
import { fetchPrices } from '../services/priceService';
import PriceTable from '../components/PriceTable.vue';

moment.tz.setDefault("Europe/Vilnius");

const date = ref(new Date());
const minDate = ref(new Date("2012-07-01"));
const priceData = ref([]);
const nextDay = moment().add(1, 'days').format('YYYY-MM-DD');

const selectedDate = ref(new Date());
const isLoading = ref(true);

const toggleDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  selectedDate.value = selectedDate.value.getDate() === tomorrow.getDate() 
    ? new Date() 
    : tomorrow;
  loadPrices(); // Assuming you have this method to load prices
};

const getDateButtonText = () => {
  return selectedDate.value.getDate() === new Date().getDate() 
    ? 'Show Tomorrow' 
    : 'Show Today';
};

watch(date, async (newValue) => {
  try {
    const data = await fetchPrices(newValue);
    priceData.value = data.data?.lt || [];
  } catch (error) {
    priceData.value = [];
  }
}, { immediate: true });

function setToday() {
  date.value = new Date();
}
</script>

<template>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1>Electricity Prices</h1>
      <button 
        class="btn btn-outline-primary" 
        @click="toggleDate"
        :disabled="isLoading"
      >
        {{ getDateButtonText() }}
      </button>
    </div>
    <div class="home-page">
      <h1 class="mb-3">Electricity Prices</h1>
      <div class="d-flex gap-2 mb-3">
        <VueDatePicker v-model="date" locale="lt" month-name-format="long" format="yyyy-MM-dd" 
          auto-apply reverse-years :enable-time-picker="false" 
          :max-date="nextDay" :min-date="minDate" prevent-min-max-navigation 
          class="flex-grow-1" />
        <button @click="setToday" class="btn btn-secondary">Today</button>
      </div>

      <PriceTable :priceData="priceData" />
      
      <div class="text-center mt-4">
        <RouterLink to="/settings" class="btn btn-secondary">Settings</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  padding: 1rem;
}
</style>
