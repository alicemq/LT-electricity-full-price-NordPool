import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function priceApiPlugin() {
  return {
    name: 'price-api',
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url.startsWith('/priceapi/v1')) {
            return next();
          }

          const { handlePriceApi } = await import('./src/services/apiService.js');
          const data = await handlePriceApi(req.url);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data, null, 2));
        });
      };
    }
  };
}

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    priceApiPlugin()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})