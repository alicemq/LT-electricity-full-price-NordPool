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

watch(date, async (newValue) => {
  try {
    const data = await fetchPrices(newValue);
    priceData.value = data.data?.lt || [];
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    priceData.value = [];
  }
}, { immediate: true });

function setToday() {
  date.value = new Date();
}
</script>

<template>
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
</template>

<style scoped>
.home-page {
  padding: 1rem;
}
</style>
