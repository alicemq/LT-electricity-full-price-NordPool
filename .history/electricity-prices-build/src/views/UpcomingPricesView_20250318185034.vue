<script setup>
import { ref, computed, onMounted } from 'vue';
import PriceTable from '../components/PriceTable.vue';
import { fetchPrices } from '../services/priceService';
import moment from 'moment-timezone';

const priceData = ref([]);
const isLoading = ref(true);
const error = ref(null);

const allPrices = ref([]); // Store all prices for average calculation
const upcomingPrices = computed(() => {
  const currentTime = new Date();
  return allPrices.value
    .filter(price => new Date(price.timestamp) >= currentTime)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
});

const loadPrices = async () => {
  try {
    isLoading.value = true;
    
    // Match exactly how HomeView fetches data
    const today = moment();
    const data = await fetchPrices(today);
    
    // Try tomorrow if today is empty or nearly over
    const tomorrow = moment().add(1, 'days');
    const tomorrowData = await fetchPrices(tomorrow);
    
    // Extract prices exactly as HomeView does
    const todayPrices = data?.data?.lt || [];
    const tomorrowPrices = tomorrowData?.data?.lt || [];
    
    // Combine and sort prices
    const combined = [...todayPrices, ...tomorrowPrices]
      .filter(price => price !== null && price !== undefined)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    allPrices.value = combined; // Store all prices
    priceData.value = upcomingPrices.value; // Store only upcoming prices
    
    console.log(`Loaded ${combined.length} total prices, ${priceData.value.length} upcoming`);
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
    <div v-else-if="!priceData.length" class="alert alert-warning">
      No price data available.
    </div>
    <div v-else>
      <!-- Pass both upcoming prices and all prices for proper average calculation -->
      <PriceTable :priceData="priceData" :allPriceData="allPrices" />
    </div>
  </div>
</template>
