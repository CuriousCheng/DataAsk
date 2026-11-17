import { createRouter, createWebHistory } from "vue-router"
import Skills from "./views/Skills.vue"
import Memories from "./views/Memories.vue"
import Profile from "./views/Profile.vue"
import DangerZone from "./views/DangerZone.vue"

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/user/profile" },
    { path: "/agent/skills", name: "agent-skills", component: Skills },
    { path: "/agent/memories", name: "agent-memories", component: Memories },
    { path: "/user/profile", name: "user-profile", component: Profile },
    { path: "/user/danger-zone", name: "user-danger", component: DangerZone },
    { path: "/:pathMatch(.*)*", redirect: "/user/profile" },
  ],
})