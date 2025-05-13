<script setup>
import BottomMenu from './components/BottomMenu.vue'
</script>

<template>
  <RouterView />
  <BottomMenu />
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
}
</style>
