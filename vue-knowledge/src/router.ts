import { createRouter, createWebHistory } from "vue-router"
import Knowledge from "./views/Knowledge.vue"

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/file-explorer" },
    { path: "/file-explorer", name: "knowledge", component: Knowledge },
    { path: "/:pathMatch(.*)*", redirect: "/file-explorer" },
  ],
})