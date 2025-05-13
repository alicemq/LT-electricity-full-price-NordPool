<template>
  <div class="swagger-container">
    <iframe src="/docs/swagger.yaml" frameborder="0" class="swagger-iframe"></iframe>
  </div>
</template>

<script setup>
// No script needed for simple iframe embed
</script>

<style scoped>
.swagger-container {
  width: 100vw;
  height: calc(100vh - 56px); /* Adjust for bottom menu height if needed */
  overflow: hidden;
}
.swagger-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style> 