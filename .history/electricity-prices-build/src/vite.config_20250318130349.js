import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
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
      },
      '^/priceapi/v1($|/.*)': {  // Changed regex to catch root endpoint
        target: 'http://localhost:5173',
        bypass: async function(req, res) {
          try {
            const { handlePriceApi } = await import('./src/services/apiService.js');
            const data = await handlePriceApi(req.url);
            res.setHeader('Content-Type', 'application/json');
            return JSON.stringify(data);
          } catch (error) {
            console.error('Price API error:', error);
            res.statusCode = 500;
            return JSON.stringify({ error: 'Internal server error' });
          }
        }
      }
    }
  }
})