<script setup>
import { ref, onMounted } from 'vue';
import moment from 'moment-timezone';
import { fetchPrices } from '../services/priceService';
import { calculatePrice } from '../services/priceCalculationService';

const jsonData = ref(null);

function filterFuturePrices(prices) {
  const now = moment().unix();
  return prices.filter(price => price.timestamp >= now);
}

onMounted(async () => {
  try {
    const [todayData, tomorrowData] = await Promise.all([
      fetchPrices(new Date()),
      fetchPrices(moment().add(1, 'days').toDate())
    ]);

    const todayPrices = filterFuturePrices(todayData.data?.lt || []);
    const tomorrowPrices = tomorrowData.data?.lt || [];

    const processPrice = price => ({
      timestamp: price.timestamp,
      hour: moment.unix(price.timestamp).format('HH:mm'),
      originalPrice: price.price,
      calculatedPrice: calculatePrice(price)
    });

    jsonData.value = {
      from: moment().format('YYYY-MM-DD HH:mm'),
      to: moment().add(1, 'days').endOf('day').format('YYYY-MM-DD HH:mm'),
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
