import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UpcomingPrices from '../components/UpcomingPrices.vue'

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
      name: 'priceSettings',
      component: () => import('../views/SettingsView.vue'),
      meta: {
        title: 'Price Threshold Settings'
      }
    },
    {
      path: '/todayprices',
      component: () => import('../views/JsonPriceView.vue')
    },
    {
      path: '/futureprices',
      component: () => import('../views/JsonFuturePriceView.vue')
    },
    {
      path: '/upcoming',
      name: 'upcoming',
      component: () => import('../views/UpcomingPricesView.vue')
    }
  ]
})

export default router
