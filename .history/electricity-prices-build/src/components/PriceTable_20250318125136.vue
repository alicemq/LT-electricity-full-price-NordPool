<script setup>
import { computed } from 'vue';
import { formatPriceHours, isCurrentHour } from '../services/timeService';
import { calculatePrice } from '../services/priceCalculationService';

const props = defineProps({
  priceData: {
    type: Array,
    required: true,
    default: () => []
  }
})

const hasEnoughData = computed(() => props.priceData && props.priceData.length >= 3)
</script>

<template>
  <div v-if="!hasEnoughData" class="alert alert-warning" role="alert">
    Price data is not yet available for selected date.
  </div>
  <table v-else class="table table-hover table-striped table-sm">
    <thead class="table-dark">
      <tr>
        <th scope="col" class="header">Hour</th>
        <th scope="col" class="header">Price ct/kWh</th>
      </tr>
    </thead>
    <tbody class="table-group-divider">
      <tr v-for="prices in priceData" :key="prices.timestamp" :data-original-price="prices.price">
        <td v-html="formatPriceHours(prices.timestamp, 1)" :class="isCurrentHour(prices.timestamp)"></td>
        <td :class="isCurrentHour(prices.timestamp)">{{ calculatePrice(prices) }}</td>
      </tr>
    </tbody>
  </table>
</template>
