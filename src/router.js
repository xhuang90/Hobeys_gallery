import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import AddEntry from './views/AddEntry.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/add', component: AddEntry },
    { path: '/:type', component: () => import('./views/Collection.vue') },
    { path: '/:type/:slug', component: () => import('./views/Detail.vue') },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
