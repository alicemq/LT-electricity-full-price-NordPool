<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { handlePriceApi } from './services/apiService';

const route = useRoute();
const isApiRoute = computed(() => route.path.startsWith('/priceapi'));

if (isApiRoute.value) {
  handlePriceApi(route.path).then(data => {
    document.body.innerHTML = `<pre style="padding: 20px">${JSON.stringify(data, null, 2)}</pre>`;
  });
}
</script>

<template>
  <RouterView v-if="!isApiRoute" />
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
}
</style>
