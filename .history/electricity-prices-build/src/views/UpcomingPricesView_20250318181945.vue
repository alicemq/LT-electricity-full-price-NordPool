<script setup>
import { ref, onMounted } from 'vue';
import UpcomingPrices from '../components/UpcomingPrices.vue';
import { fetchTodayPrices, fetchTomorrowPrices } from '../services/priceService';

const priceData = ref([]);
const isLoading = ref(true);
const error = ref(null);

const loadPrices = async () => {
  try {
    isLoading.value = true;
    const today = await fetchTodayPrices();
    const tomorrow = await fetchTomorrowPrices();
    console.log('Loaded prices:', { today, tomorrow }); // Debug log
    priceData.value = [...today, ...tomorrow].filter(price => price !== null);
  } catch (e) {
    error.value = e.message;
    console.error('Error loading prices:', e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadPrices();
});
</script>

<template>
  <div>
    <div v-if="isLoading" class="alert alert-info">
      Loading prices...
    </div>
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-else>
      <UpcomingPrices :priceData="priceData" />
    </div>
  </div>
</template>
