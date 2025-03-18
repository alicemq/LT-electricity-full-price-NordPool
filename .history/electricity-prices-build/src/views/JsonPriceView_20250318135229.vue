<script setup>
import { ref, onMounted } from 'vue';
import { fetchPrices } from '../services/priceService';
import { calculatePrice } from '../services/priceCalculationService';

const jsonData = ref(null);

onMounted(async () => {
  try {
    const data = await fetchPrices(new Date());
    const prices = data.data?.lt || [];
    const processedPrices = prices.map(price => ({
      timestamp: price.timestamp,
      originalPrice: price.price,
      calculatedPrice: calculatePrice(price)
    }));

    jsonData.value = {
      date: new Date().toISOString().split('T')[0],
      count: processedPrices.length,
      prices: processedPrices
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
