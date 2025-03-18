<script setup>
import { ref, computed, onMounted } from 'vue';
import moment from 'moment-timezone';
import { fetchPrices } from '../services/priceService';
import { calculatePrice } from '../services/priceCalculationService';
import { getPriceClass } from '../utils/priceColor';
import PriceTable from '../components/PriceTable.vue';

const jsonData = ref(null);
const prices = ref([]);
const settings = ref(JSON.parse(localStorage.getItem('priceSettings')) || {
  cheapThreshold: 20,
  expensiveThreshold: 50,
  cheapRange: 15,
  expensiveRange: 15
});

const averagePrice = computed(() => {
  if (!prices.value.length) return 0;
  const sum = prices.value.reduce((acc, price) => acc + parseFloat(price.price), 0);
  return sum / prices.value.length;
});

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
      price: price.price,
      calculatedPrice: calculatePrice(price),
      priceClass: getPriceClass(price.price, averagePrice.value, settings.value, 
        moment.unix(price.timestamp).isSame(moment(), 'hour'))
    });

    prices.value = [
      ...todayPrices.map(processPrice),
      ...tomorrowPrices.map(processPrice)
    ];

    jsonData.value = {
      fromDate: moment().format('YYYY-MM-DD HH:mm'),
      toDate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm'),
      count: prices.value.length,
      prices: prices.value
    };
  } catch (error) {
    jsonData.value = { error: 'Failed to fetch prices' };
  }
});
</script>

<template>
  <div v-if="jsonData">
    <h2>Electricity Prices</h2>
    <div class="mb-3">
      <strong>From:</strong> {{ jsonData.fromDate }} 
      <strong>To:</strong> {{ jsonData.toDate }}
    </div>
    <PriceTable :priceData="prices" />
    <pre v-if="import.meta.env.DEV">{{ JSON.stringify(jsonData, null, 2) }}</pre>
  </div>
</template>

<style scoped>
pre {
  margin-top: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  white-space: pre-wrap;
}
</style>
