<script setup>
import { ref, onMounted } from 'vue';
import UpcomingPrices from '../components/UpcomingPrices.vue';
import { fetchTodayPrices, fetchTomorrowPrices } from '../services/priceService';

const priceData = ref([]);

const loadPrices = async () => {
  const today = await fetchTodayPrices();
  const tomorrow = await fetchTomorrowPrices();
  priceData.value = [...today, ...tomorrow];
};

onMounted(() => {
  loadPrices();
});
</script>

<template>
  <UpcomingPrices :priceData="priceData" />
</template>
