import { createRouter, createWebHistory } from 'vue-router'
import General from './views/General.vue'
import DataConnection from './views/DataConnection.vue'
import DataSecurity from './views/DataSecurity.vue'
import EmbedThreads from './views/EmbedThreads.vue'
import DangerZone from './views/DangerZone.vue'
import BusinessList from './views/BusinessList.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/general' },
    { path: '/general', name: 'general', component: General },
    { path: '/businesses', name: 'businesses', component: BusinessList },
    { path: '/data-connection', name: 'data-connection', component: DataConnection },
    { path: '/data-security', name: 'data-security', component: DataSecurity },
    { path: '/embed-threads', name: 'embed-threads', component: EmbedThreads },
    { path: '/danger-zone', name: 'danger-zone', component: DangerZone },
    { path: '/:pathMatch(.*)*', redirect: '/general' },
  ],
})