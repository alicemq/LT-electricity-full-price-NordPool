import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const ApiHandler = {
  name: 'ApiHandler',
  async beforeRouteEnter(to, from, next) {
    try {
      const { handlePriceApi } = await import('../services/apiService');
      const data = await handlePriceApi(to.path);
      document.open();
      document.write(`<pre style="padding: 20px">${JSON.stringify(data, null, 2)}</pre>`);
      document.close();
      next(false);
    } catch (error) {
      document.open();
      document.write(JSON.stringify({ error: 'API Error', message: error.message }));
      document.close();
      next(false);
    }
  },
  template: '<div></div>'
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/priceapi/:pathMatch(.*)*',
      name: 'api',
      component: ApiHandler
    }
  ]
})

export default router
