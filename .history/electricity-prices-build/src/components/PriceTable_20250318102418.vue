<script setup>
import { formatPriceHours, isCurrentHour } from '../services/timeService';
import { calculatePrice } from '../services/priceCalculationService';

const props = defineProps({
  priceData: {
    type: Array,
    required: true,
    default: () => []
  }
})
</script>

<template>
  <table class="table table-hover table-striped table-sm">
    <thead class="table-dark">
      <tr>
        <th scope="col" class="header">Hour</th>
        <th scope="col" class="header">Price ct/kWh</th>
      </tr>
    </thead>
    <tbody class="table-group-divider">
      <tr v-for="prices in priceData" :key="prices.timestamp">
        <td v-html="formatPriceHours(prices.timestamp, 1)" :class="isCurrentHour(prices.timestamp)"></td>
        <td :class="isCurrentHour(prices.timestamp)">{{ calculatePrice(prices) }}</td>
      </tr>
    </tbody>
  </table>
</template>
