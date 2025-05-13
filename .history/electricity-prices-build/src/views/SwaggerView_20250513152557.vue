<template>
  <div class="swagger-container">
    <div id="swagger-ui"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Load Swagger UI from CDN
  if (!window.SwaggerUIBundle) {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js'
    script.onload = () => {
      window.SwaggerUIBundle({
        url: '/docs/swagger.yaml',
        dom_id: '#swagger-ui',
        presets: [window.SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
      })
    }
    document.body.appendChild(script)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css'
    document.head.appendChild(link)
  } else {
    window.SwaggerUIBundle({
      url: '/docs/swagger.yaml',
      dom_id: '#swagger-ui',
      presets: [window.SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout',
    })
  }
})
</script>

<style scoped>
.swagger-container {
width:70vh;
  height: calc(100vh - 56px);
  overflow: auto;
  background: #fff;
}
#swagger-ui {
  background: #fff;
}
</style> 