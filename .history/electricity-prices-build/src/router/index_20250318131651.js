import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      beforeEnter: async (to, from) => {
        const { handlePriceApi } = await import('../services/apiService');
        const data = await handlePriceApi(to.path);
        document.open();
        document.write(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
        document.close();
        return false;
      }
    }
  ]
})

export default router
