import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://dashboard.elering.ee',
        changeOrigin: true,
        secure: false
      }
    },
    middlewares: [
      async (req, res, next) => {
        if (req.url === '/todayprices') {
          const { fetchPrices } = await import('./src/services/priceService');
          const data = await fetchPrices(new Date());
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data.data.lt));
          return;
        }
        next();
      }
    ]
  }
})