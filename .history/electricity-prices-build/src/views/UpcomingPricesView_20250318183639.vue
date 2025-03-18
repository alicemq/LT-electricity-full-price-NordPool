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
    
    // Use the same approach as in HomeView
    const todayData = await fetchPrices(today);
    const tomorrowData = await fetchPrices(tomorrow);
    
    // Extract Lithuania data - use same data path as HomeView
    const todayPrices = todayData.data?.lt || [];
    const tomorrowPrices = tomorrowData.data?.lt || [];
    
    console.log('Extracted prices:', { todayPrices, tomorrowPrices });
    
    // Combine and sort prices
    priceData.value = [...todayPrices, ...tomorrowPrices]
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
