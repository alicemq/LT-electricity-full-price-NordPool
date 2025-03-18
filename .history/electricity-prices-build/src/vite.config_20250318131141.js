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
    middleware: {
      pre: [
        (req, res, next) => {
          if (req.url.startsWith('/priceapi/v1')) {
            import('./src/services/apiService.js')
              .then(({ handlePriceApi }) => handlePriceApi(req.url))
              .then(data => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data, null, 2));
              })
              .catch(() => next());
          } else {
            next();
          }
        }
      ]
    }
  }
})