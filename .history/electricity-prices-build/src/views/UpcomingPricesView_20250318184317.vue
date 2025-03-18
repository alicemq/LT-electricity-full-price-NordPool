<script setup>
import { ref, onMounted, computed } from 'vue';
import PriceTable from '../components/PriceTable.vue';
import { fetchPrices } from '../services/priceService';
import moment from 'moment-timezone';

const priceData = ref([]);
const isLoading = ref(true);
const error = ref(null);
const numberOfHours = ref(12); 

const upcomingPrices = computed(() => {
  const currentTime = new Date();
  return priceData.value
    .filter(price => new Date(price.timestamp) >= currentTime)
    .slice(0, numberOfHours.value);
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
    
    priceData.value = combined;
  } catch (e) {
    error.value = e.message;
    console.error('Error loading prices:', e);
  } finally {
    isLoading.value = false;
  }
};

const changeNumberOfHours = (value) => {
  numberOfHours.value = value;
  localStorage.setItem('upcomingPricesHours', value);
};

onMounted(() => {
  const savedHours = localStorage.getItem('upcomingPricesHours');
  if (savedHours) {
    numberOfHours.value = parseInt(savedHours);
  }
  loadPrices();
});
</script>

<template>
  <div class="container">
    <h1 class="mb-3">Upcoming Prices</h1>
    
    <!-- Hours setting -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Number of hours to display</label>
          <input 
            type="range" 
            class="form-range" 
            min="1" 
            max="24" 
            v-model="numberOfHours"
            @input="changeNumberOfHours($event.target.value)"
          >
          <div class="text-center">{{ numberOfHours }} hours</div>
        </div>
      </div>
    </div>
    
    <!-- Loading and error states -->
    <div v-if="isLoading" class="alert alert-info">
      Loading prices...
    </div>
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-else-if="!upcomingPrices.length" class="alert alert-warning">
      No upcoming prices available.
    </div>
    <div v-else>
      <!-- Use PriceTable component with filtered upcoming prices -->
      <PriceTable :priceData="upcomingPrices" />
    </div>
  </div>
</template>
