<script setup>
import { useStorage } from '@vueuse/core';
import { timeZones } from '../config/priceConfig';

const theDefault = {
  zone: "Four zones",
  plan: "Smart",
  vendorMargin: '0.02003',
  VIAP: 0,
  distributionplus: "0.00054",
  PVMIncluded: true
}

const state = useStorage('elecsettings', theDefault)
</script>

<template>
  <div class="settings-container">
    <!-- Move settings form HTML here -->
    <!-- ...existing settings template code... -->
  </div>
</template>
