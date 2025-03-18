<script setup>
import { ref, watch } from 'vue'
import moment from 'moment-timezone';
import { fetchPrices } from '../services/priceService';
import PriceSettings from '../components/PriceSettings.vue';
import PriceTable from '../components/PriceTable.vue';

moment.tz.setDefault("Europe/Vilnius");

const date = ref(new Date());
const minDate = ref(new Date("2012-07-01"));
const priceData = ref([]);
const nextDay = moment().add(1, 'days').format('YYYY-MM-DD');

watch(date, async (newValue) => {
  const data = await fetchPrices(newValue);
  priceData.value = data.data.lt;
}, { immediate: true });
</script>

<template>
  <div class="home-page">
    <RouterLink to="/settings" class="btn btn-secondary float-end">Settings</RouterLink>
    <VueDatePicker v-model="date" locale="lt" month-name-format="long" format="yyyy-MM-dd" 
      auto-apply reverse-years :enable-time-picker="false" 
      :max-date="nextDay" :min-date="minDate" prevent-min-max-navigation />

    <PriceTable :priceData="priceData" />
    <PriceSettings />
  </div>
</template>

<style scoped>
.home-page {
  padding: 1rem;
}
</style>
