import { createRouter, createWebHistory } from "vue-router"
import Modeling from "./views/Modeling.vue"

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "modeling", component: Modeling },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
})