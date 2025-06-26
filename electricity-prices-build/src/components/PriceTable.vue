<script setup>
import { computed, ref } from 'vue';
import { formatPriceHours, isCurrentHour } from '../services/timeService';
import { calculatePrice } from '../services/priceCalculationService';
import { getPriceClass } from '../utils/priceColor';

const props = defineProps({
  priceData: {
    type: Array,
    required: true,
    default: () => []
  },
  allPriceData: {
    type: Array,
    required: false,
    default: null // Will use priceData if not provided
  }
})

const hasEnoughData = computed(() => props.priceData && props.priceData.length >= 3)

const settings = ref(JSON.parse(localStorage.getItem('priceSettings')) || {
  cheapThreshold: 20,
  expensiveThreshold: 50,
  cheapRange: 15,
  expensiveRange: 15
});

const averagePrice = computed(() => {
  // Use allPriceData for average calculation if provided, otherwise use priceData
  const dataToUse = props.allPriceData || props.priceData;
  
  if (!dataToUse.length) return 0;
  const sum = dataToUse.reduce((acc, price) => acc + parseFloat(calculatePrice(price)), 0);
  return sum / dataToUse.length;
});

const getRowClass = (price) => {
  const priceValue = parseFloat(calculatePrice(price));
  return getPriceClass(
    priceValue, 
    averagePrice.value, 
    settings.value, 
    isCurrentHour(price.timestamp)
  );
};

const getRowInfo = (price) => {
  const priceValue = parseFloat(calculatePrice(price));
  return { classes: getPriceClass(
    priceValue, 
    averagePrice.value, 
    settings.value, 
    isCurrentHour(price.timestamp)
  ).classes };
};

const isCurrentHourClass = (timestamp) => {
  return isCurrentHour(timestamp) ? 'fw-bold border border-dark' : '';
};
</script>

<template>
  <div v-if="!hasEnoughData" class="alert alert-warning" role="alert">
    Price data is not yet available for selected date.<br>Data is typically available after 15:00 local time (13:00 UTC).
  </div>
  <div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead>
        <tr class="table-dark">
          <th scope="col">Hour</th>
          <th scope="col">Price ct/kWh</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="price in priceData" 
          :key="price.timestamp" 
          :class="[
            getRowInfo(price).classes,
            isCurrentHourClass(price.timestamp)
          ]"
        >
          <td v-html="formatPriceHours(price.timestamp, 1)"></td>
          <td>{{ calculatePrice(price) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="card mt-3">
      <div class="card-body d-flex justify-content-between align-items-center">
        <span class="fw-bold">Average Price:</span>
        <span class="badge bg-primary">{{ averagePrice.toFixed(2) }} ct/kWh</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Remove all custom styling and rely on Bootstrap classes */
</style>
