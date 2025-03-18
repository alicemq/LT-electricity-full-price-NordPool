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
    
    // Store all prices for average calculation
    const combined = [...todayPrices, ...tomorrowPrices]
      .filter(price => price !== null && price !== undefined)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    allPrices.value = combined;
    
    // Filter to show only current and future prices
    const now = new Date();
    const currentHour = now.getHours();
    
    const upcomingPrices = combined.filter(price => {
      const priceDate = new Date(price.timestamp);
      const priceDay = priceDate.getDate();
      const priceHour = priceDate.getHours();
      
      if (priceDay === now.getDate()) {
        // For today, show current hour and future hours
        return priceHour >= currentHour;
      } else {
        // For future days, show all hours
        return priceDay > now.getDate();
      }
    });
    
    priceData.value = upcomingPrices;
    
    console.log(`Loaded ${allPrices.value.length} total prices, showing ${priceData.value.length} upcoming prices`);
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
