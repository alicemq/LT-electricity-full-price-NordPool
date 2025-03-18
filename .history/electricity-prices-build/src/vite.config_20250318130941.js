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
      }
    },
    fs: {
      strict: true
    },
    middlewares: [
      async function priceApiMiddleware(req, res, next) {
        if (req.url.startsWith('/priceapi/v1')) {
          try {
            const { handlePriceApi } = await import('./src/services/apiService.js');
            const data = await handlePriceApi(req.url);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data, null, 2));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        } else {
          next();
        }
      }
    ]
  }
})