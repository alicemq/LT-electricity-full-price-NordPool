import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const TodayPricesHandler = {
  template: '<div></div>',
  async created() {
    const { fetchPrices } = await import('../services/priceService');
    try {
      const data = await fetchPrices(new Date());
      const response = data.data?.lt || [];
      document.write(JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        count: response.length,
        prices: response
      }, null, 2));
    } catch (error) {
      document.write(JSON.stringify({ error: 'Failed to fetch prices' }));
    }
  }
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
      path: '/todayprices',
      component: TodayPricesHandler
    }
  ]
})

export default router
