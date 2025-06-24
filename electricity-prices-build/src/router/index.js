import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UpcomingPrices from '../components/UpcomingPrices.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'today',
      component: HomeView
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: {
        title: 'Settings'
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
