import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ThreadView from '../views/ThreadView.vue'
import ArtifactsView from '../views/ArtifactsView.vue'
import EmbedView from '../views/EmbedView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/artifacts', name: 'artifacts', component: ArtifactsView },
    { path: '/embed/:token', name: 'embed', component: EmbedView, meta: { public: true } },
    { path: '/:threadId', name: 'thread', component: ThreadView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})