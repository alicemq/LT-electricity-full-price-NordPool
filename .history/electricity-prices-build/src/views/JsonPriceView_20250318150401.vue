<script setup>
import { ref, computed, onMounted } from 'vue';
import moment from 'moment-timezone';
import { fetchPrices } from '../services/priceService';
import { calculatePrice } from '../services/priceCalculationService';
import { getPriceClass } from '../utils/priceColor';

const jsonData = ref(null);
const isDev = computed(() => import.meta.env.DEV);

const settings = JSON.parse(localStorage.getItem('priceSettings')) || {
  cheapThreshold: 20,
  expensiveThreshold: 50,
  cheapRange: 15,
  expensiveRange: 15
};

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

    const allPrices = [...todayPrices, ...tomorrowPrices];
    const averagePrice = allPrices.reduce((acc, price) => acc + parseFloat(calculatePrice(price)), 0) / allPrices.length;

    const processPrice = price => {
      const calculatedPrice = parseFloat(calculatePrice(price));
      const priceInfo = getPriceClass(calculatedPrice, averagePrice, settings, false);
      return {
        timestamp: price.timestamp,
        originalPrice: price.price,
        calculatedPrice,
        classification: {
          type: priceInfo.classes ? priceInfo.classes : 'normal',
          reason: priceInfo.reason
        }
      };
    };

    jsonData.value = {
      fromDate: moment().format('YYYY-MM-DD HH:mm'),
      toDate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm'),
      settings,
      averagePrice: averagePrice.toFixed(2),
      count: allPrices.length,
      prices: allPrices.map(processPrice)
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
