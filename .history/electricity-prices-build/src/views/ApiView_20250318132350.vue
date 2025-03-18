<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { handlePriceApi } from '../services/apiService';

const route = useRoute();

onMounted(async () => {
  const data = await handlePriceApi(route.path);
  document.body.innerHTML = `<pre style="padding: 20px">${JSON.stringify(data, null, 2)}</pre>`;
});
</script>

<template>
  <div>Loading...</div>
</template>
