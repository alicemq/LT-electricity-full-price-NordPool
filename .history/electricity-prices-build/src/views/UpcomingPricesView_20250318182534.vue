<script setup>
import { ref, onMounted } from 'vue';
import UpcomingPrices from '../components/UpcomingPrices.vue';
import { fetchPrices } from '../services/priceService';
import moment from 'moment-timezone';

const priceData = ref([]);
const isLoading = ref(true);
const error = ref(null);

const loadPrices = async () => {
  try {
    isLoading.value = true;
    const today = moment();
    const tomorrow = moment().add(1, 'days');
    
    const todayPrices = await fetchPrices(today);
    const tomorrowPrices = await fetchPrices(tomorrow);

    console.log('API Response:', { todayPrices, tomorrowPrices }); // Debug log

    // Ensure we have arrays and handle the correct response structure
    const todayData = Array.isArray(todayPrices) ? todayPrices : (todayPrices?.prices || []);
    const tomorrowData = Array.isArray(tomorrowPrices) ? tomorrowPrices : (tomorrowPrices?.prices || []);

    priceData.value = [...todayData, ...tomorrowData]
      .filter(price => price !== null)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log('Processed data:', priceData.value); // Debug log

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
