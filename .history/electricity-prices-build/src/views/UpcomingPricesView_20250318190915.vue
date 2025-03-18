<script setup>
import { ref, onMounted } from 'vue';
import PriceTable from '../components/PriceTable.vue';
import { fetchPrices } from '../services/priceService';
import { calculatePrice } from '../services/priceCalculationService';
import { formatPriceHours } from '../services/timeService';
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
    
    // Filter by timestamp to show only current and upcoming hours
    // Use moment.js for better timezone handling
    const nowMoment = moment();
    const nowHour = nowMoment.startOf('hour');
    
    const upcomingPrices = combined.filter(price => {
      // Parse the timestamp with moment for proper timezone handling
      const priceTime = moment(price.timestamp);
      
      // Compare with current hour (same or later)
      return priceTime.isSameOrAfter(nowHour);
    });
    
    priceData.value = upcomingPrices;
    
    // Log only calculated price objects
    console.log('Calculated Price Objects:');
    const calculatedPrices = priceData.value.map(price => ({
      timestamp: price.timestamp,
      formattedTime: formatPriceHours(price.timestamp, 1),
      rawPrice: price.price,
      calculatedPrice: calculatePrice(price)
    }));
    
    console.log(calculatedPrices);
    
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
