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
  if (!props.priceData.length) return 0;
  const sum = props.priceData.reduce((acc, price) => acc + parseFloat(price.originalPrice || price.price), 0);
  return sum / props.priceData.length;
});

const getRowClass = (price) => {
  const priceValue = parseFloat(price.originalPrice || price.price);
  return getPriceClass(
    priceValue, 
    averagePrice.value, 
    settings.value, 
    isCurrentHour(price.timestamp)
  );
};
</script>

<template>
  <div v-if="!hasEnoughData" class="alert alert-warning" role="alert">
    Price data is not yet available for selected date.
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
            getRowClass(price),
            isCurrentHour(price.timestamp) ? 'fw-bold' : ''
          ]"
        >
          <td v-html="formatPriceHours(price.timestamp, 1)"></td>
          <td>{{ calculatePrice(price) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
