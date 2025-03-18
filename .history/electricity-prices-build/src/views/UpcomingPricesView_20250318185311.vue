<script setup>
import { ref, onMounted } from 'vue';
import PriceTable from '../components/PriceTable.vue';
import { fetchPrices } from '../services/priceService';
import moment from 'moment-timezone';

const priceData = ref([]);
const allPrices = ref([]);
const isLoading = ref(true);
const error = ref(null);

const loadPrices = async () => {
  try {
    isLoading.value = true;
    
    const today = moment();
    const data = await fetchPrices(today);
    
    const tomorrow = moment().add(1, 'days');
    const tomorrowData = await fetchPrices(tomorrow);
    
    const todayPrices = data?.data?.lt || [];
    const tomorrowPrices = tomorrowData?.data?.lt || [];
    
    // Store all prices
    allPrices.value = [...todayPrices, ...tomorrowPrices]
      .filter(price => price !== null && price !== undefined)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Get current time in proper format for comparison
    const now = new Date();
    // Use direct JavaScript Date comparison instead of moment.js
    const upcoming = allPrices.value.filter(price => {
      const priceTime = new Date(price.timestamp);
      // Include the current hour by checking if hour is greater or equal
      if (priceTime.getDate() === now.getDate()) {
        return priceTime.getHours() >= now.getHours();
      }
      return priceTime > now;
    });
    
    priceData.value = upcoming;
    
    console.log(`Loaded ${allPrices.value.length} total prices, ${priceData.value.length} upcoming`);
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
  <div class="container">
    <h1 class="mb-3">Upcoming Prices</h1>
    
    <!-- Loading and error states -->
    <div v-if="isLoading" class="alert alert-info">
      Loading prices...
    </div>
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-else-if="priceData.length === 0" class="alert alert-warning">
      No upcoming prices available.
    </div>
    <div v-else>
      <PriceTable :priceData="priceData" :allPriceData="allPrices" />
    </div>
  </div>
</template>
