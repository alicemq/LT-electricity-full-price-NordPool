<script setup>
import { ref, computed, onMounted } from 'vue';
import moment from 'moment-timezone';
import { fetchPrices } from '../services/priceService';
import { calculatePrice } from '../services/priceCalculationService';
import PriceTable from '../components/PriceTable.vue';

const jsonData = ref(null);
const prices = ref([]);

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

    prices.value = [
      ...todayPrices.map(p => ({ 
        timestamp: p.timestamp,
        price: p.price,
        originalPrice: p.price,
      })),
      ...tomorrowPrices.map(p => ({ 
        timestamp: p.timestamp,
        price: p.price,
        originalPrice: p.price,
      }))
    ];

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
  <div v-if="prices.length">
    <PriceTable :priceData="prices" />
  </div>
  <pre v-if="import.meta.env.DEV">{{ JSON.stringify(jsonData, null, 2) }}</pre>
</template>

<style>
pre {
  padding: 1rem;
  background: #f5f5f5;
  white-space: pre-wrap;
}
</style>
