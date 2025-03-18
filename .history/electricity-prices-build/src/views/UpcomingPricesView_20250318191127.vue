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
    
    // Filter by timestamp using moment.js for better handling
    const now = moment();
    // Round down to the current hour start
    const currentHourStart = now.clone().startOf('hour');
    
    // Filter to only include current hour and future hours
    const upcomingPrices = combined.filter(price => {
      const priceTime = moment(price.timestamp);
      return priceTime.isSameOrAfter(currentHourStart);
    });
    
    priceData.value = upcomingPrices;
    
    // Log only calculated price objects with timestamp filtering
    console.log('Calculated Price Objects (current & future hours):');
    const calculatedPrices = priceData.value.map(price => {
      const priceTime = moment(price.timestamp);
      return {
        timestamp: price.timestamp,
        formattedTime: formatPriceHours(price.timestamp, 1),
        isCurrent: priceTime.isSame(currentHourStart, 'hour'),
        rawPrice: price.price,
        calculatedPrice: calculatePrice(price)
      };
    });
    
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
