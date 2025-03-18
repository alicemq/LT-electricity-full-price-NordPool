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
    
    const todayResponse = await fetchPrices(today);
    const tomorrowResponse = await fetchPrices(tomorrow);

    console.log('API Response:', { todayResponse, tomorrowResponse });

    // Extract Lithuania (lt) price data from each response
    const todayData = todayResponse?.data?.lt || [];
    const tomorrowData = tomorrowResponse?.data?.lt || [];

    console.log('Extracted data:', { todayData, tomorrowData });

    priceData.value = [...todayData, ...tomorrowData]
      .filter(price => price !== null)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log('Final processed data:', priceData.value);

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
