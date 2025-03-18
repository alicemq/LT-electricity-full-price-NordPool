<script setup>
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import moment from 'moment-timezone';
import { fetchPrices } from './services/priceService';
import { formatPriceHours, isCurrentHour } from './services/timeService';
import PriceSettings from './components/PriceSettings.vue';

moment.tz.setDefault("Europe/Vilnius");

const date = ref(new Date());
const minDate = ref(new Date("2012-07-01"));
const priceData = ref([]);
const nextDay = moment().add(1, 'days').format('YYYY-MM-DD');

watch(date, async (newValue) => {
  const data = await fetchPrices(newValue);
  priceData.value = data.data;
}, { immediate: true });

// ...remaining necessary functions...
</script>

<template>
  <VueDatePicker v-model="date" locale="lt" month-name-format="long" format="yyyy-MM-dd" 
    auto-apply reverse-years :enable-time-picker="false" 
    :max-date="nextDay" :min-date="minDate" prevent-min-max-navigation />

  <table class="table table-hover table-striped table-sm">
    <!-- ...existing table template... -->
  </table>

  <PriceSettings />
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
}
</style>
