<script setup>
import { useStorage, watch } from '@vueuse/core';
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

// Watch for zone changes to handle Smart plan
watch(state, (newValue) => {
  if (newValue.zone === "Four zones") {
    state.value.plan = "Smart"
  } else if (newValue.zone !== "Four zones" && newValue.plan === "Smart") {
    state.value.plan = "Standart"
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
      <div class="form-check" v-for="plan in timeZones[state.zone].values.tariffs">
        <input class="form-check-input" type="radio" :id="plan.id" :value="plan.name" v-model="state.plan"
          :checked="plan.name === state.plan">
        <label class="form-check-label" :for="plan.id">{{ plan.name }}</label>
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
      <input type="number" step="0.0001" class="form-control" name="vendorMargin" id="venmar"
        v-model="state.vendorMargin" :placeholder="state.vendorMargin" />
      <small class="form-text text-muted">Enter vendor margin in €</small>
    </div>

    <div class="mb-3">
      <label for="VIAP" class="form-label">VIAP</label>
      <input type="number" step="0.0001" class="form-control" name="VIAP" id="VIAP"
        v-model="state.VIAP" :placeholder="state.VIAP" />
      <small class="form-text text-muted">Enter VIAP price in €</small>
    </div>

    <div class="mb-3">
      <label for="distributionplus" class="form-label">National distribution margin</label>
      <input type="number" step="0.0001" class="form-control" name="distributionplus" id="distributionplus"
        v-model="state.distributionplus" :placeholder="state.distributionplus" />
      <small class="form-text text-muted">Enter national distribution margin in €</small>
    </div>
  </div>
</template>
