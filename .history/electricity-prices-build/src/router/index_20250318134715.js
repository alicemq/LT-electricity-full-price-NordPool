import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { calculatePrice } from '../services/priceCalculationService';

const ApiHandler = {
  template: '<pre>{{ jsonData }}</pre>',
  data() {
    return {
      jsonData: ''
    }
  },
  async created() {
    if (this.$route.path === '/todayprices') {
      try {
        const { fetchPrices } = await import('../services/priceService');
        const data = await fetchPrices(new Date());,
        const prices = data.data?.lt || [];
        
        const processedPrices = prices.map(price => ({
          timestamp: price.timestamp,
          originalPrice: price.price,
          calculatedPrice: calculatePrice(price)
        }));

        this.jsonData = JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          count: processedPrices.length,
          prices: processedPrices
        }, null, 2);
      } catch (error) {
        this.jsonData = JSON.stringify({ error: 'Failed to fetch prices' });
      }
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
      component: ApiHandler
    }
  ]
})

export default router
