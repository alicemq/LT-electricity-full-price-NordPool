<script setup>
import { useStorage } from '@vueuse/core';
import { watch, computed } from 'vue';
import { timeZones } from '../config/priceConfig';
import { getAvailablePlans, getMigratedPlan } from '../config/planVersionConfig';

const theDefault = {
  zone: "Four zones",
  plan: "Smart",
  vendorMargin: '0.02003',
  PVMIncluded: true
}

const state = useStorage('elecsettings', theDefault)

const currentDate = new Date().toISOString().split('T')[0];
const availablePlans = computed(() => getAvailablePlans(currentDate, state.value.zone));

watch(state, (newValue) => {
  const migratedPlan = getMigratedPlan(newValue.plan, currentDate);
  if (migratedPlan !== newValue.plan) {
    state.value.plan = migratedPlan;
  } else if (!availablePlans.value.includes(newValue.plan)) {
    state.value.plan = availablePlans.value[0];
  }
}, { deep: true })
</script>

<template>
  <div class="settings-container">
    <p>ESO time zone and plan</p>
    <div class="input-group mb-3">
      <div class="form-check" v-for="zone in timeZones">
        <input class="form-check-input" type="radio" :id="zone.id" :value="zone.name" v-model="state.zone">
        <label class="form-check-label" :for="zone.id">{{ zone.name }}</label>
      </div>
    </div>

    <div class="input-group mb-3">
      <div class="form-check" v-for="plan in availablePlans">
        <input class="form-check-input" type="radio" :id="plan" :value="plan" v-model="state.plan"
          :checked="plan === state.plan">
        <label class="form-check-label" :for="plan">{{ plan }}</label>
      </div>
    </div>

    <div class="form-check">
      <input class="form-check-input" type="radio" name="PVMIncludedYes" :id="state.PVMIncluded"
        v-model="state.PVMIncluded" :value="true" :checked="state.PVMIncluded === true" />
      <label class="form-check-label" :for="state.PVMIncluded">With VAT</label>
    </div>
    <div class="form-check">
      <input class="form-check-input" type="radio" name="PVMIncludedNo" :id="state.PVMIncluded"
        v-model="state.PVMIncluded" :value="false" :checked="state.PVMIncluded === false" />
      <label class="form-check-label" :for="state.PVMIncluded">No VAT</label>
    </div>

    <div class="mb-3">
      <label for="venmar" class="form-label">Vendor margin</label>
      <input type="number" step="0.00001" class="form-control" name="vendorMargin" id="venmar"
        v-model="state.vendorMargin" :placeholder="state.vendorMargin" />
      <small class="form-text text-muted">Enter vendor margin in €</small>
    </div>
    <!-- Remove VIAP and distributionplus inputs -->
  </div>
</template>
