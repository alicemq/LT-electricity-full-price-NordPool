<script setup>
import { ref, computed, onMounted } from 'vue';
import moment from 'moment-timezone';
import { fetchPrices } from '../services/priceService';
import { calculatePrice } from '../services/priceCalculationService';

const jsonData = ref(null);
const isDev = computed(() => import.meta.env.DEV);

function filterPricesFromNow(prices) {
  const now = moment().unix();
  return prices.filter(price => price.timestamp >= now);
}

onMounted(async () => {
  try {
    const [todayData, tomorrowData] = await Promise.all([
      fetchPrices(new Date()),
      fetchPrices(moment().add(1, 'days').toDate())
    ]);

    const todayPrices = filterPricesFromNow(todayData.data?.lt || []);
    const tomorrowPrices = tomorrowData.data?.lt || [];

    const processPrice = price => ({
      timestamp: price.timestamp,
      originalPrice: price.price,
      calculatedPrice: calculatePrice(price)
    });

    jsonData.value = {
      fromDate: moment().format('YYYY-MM-DD HH:mm'),
      toDate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm'),
      count: todayPrices.length + tomorrowPrices.length,
      prices: [
        ...todayPrices.map(processPrice),
        ...tomorrowPrices.map(processPrice)
      ]
    };
  } catch (error) {
    jsonData.value = { error: 'Failed to fetch prices' };
  }
});
</script>

<template>
  <pre>{{ JSON.stringify(jsonData, null, 2) }}</pre>
</template>

<style>
pre {
  padding: 1rem;
  background: #f5f5f5;
  white-space: pre-wrap;
}
</style>
