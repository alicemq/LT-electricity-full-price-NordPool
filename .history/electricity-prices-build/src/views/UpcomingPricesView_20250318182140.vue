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
    
    const [todayPrices, tomorrowPrices] = await Promise.all([
      fetchPrices(today),
      fetchPrices(tomorrow)
    ]);

    priceData.value = [...todayPrices, ...tomorrowPrices]
      .filter(price => price !== null)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
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
