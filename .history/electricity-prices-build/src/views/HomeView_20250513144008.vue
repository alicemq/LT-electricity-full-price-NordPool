<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import moment from 'moment-timezone';
import { fetchPrices } from '../services/priceService';
import PriceTable from '../components/PriceTable.vue';

moment.tz.setDefault("Europe/Vilnius");

const date = ref(new Date());
const minDate = ref(new Date("2012-07-01"));
const priceData = ref([]);
const nextDay = moment().add(1, 'days').format('YYYY-MM-DD');

let refreshTimeout = null;

function scheduleNextRefresh() {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  const now = new Date();
  const msToNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();
  refreshTimeout = setTimeout(async () => {
    await reloadPrices();
    scheduleNextRefresh();
  }, msToNextHour);
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    reloadPrices();
    scheduleNextRefresh();
  }
}

async function reloadPrices() {
  try {
    const data = await fetchPrices(date.value);
    priceData.value = data.data?.lt || [];
  } catch (error) {
    priceData.value = [];
  }
}

onMounted(() => {
  reloadPrices();
  scheduleNextRefresh();
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (refreshTimeout) clearTimeout(refreshTimeout);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

function setToday() {
  date.value = new Date();
}

function setTomorrow() {
  date.value = moment().add(1, 'days').toDate();
}
</script>

<template>
  <div class="container">
    <div class="home-page">
      <h1 class="mb-3">Electricity Prices</h1>
      <div class="d-flex gap-2 mb-3">
        <VueDatePicker v-model="date" locale="lt" month-name-format="long" format="yyyy-MM-dd" 
          auto-apply reverse-years :enable-time-picker="false" 
          :max-date="nextDay" :min-date="minDate" prevent-min-max-navigation 
          class="flex-grow-1" />
        <button @click="setToday" class="btn btn-secondary">Today</button>
        <button @click="setTomorrow" class="btn btn-secondary">Tomorrow</button>
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
