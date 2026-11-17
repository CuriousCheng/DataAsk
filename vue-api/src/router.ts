import { createRouter, createWebHistory } from "vue-router"
import ApiLayout from "./views/ApiLayout.vue"
import ApiHistory from "./views/ApiHistory.vue"
import ApiKeys from "./views/ApiKeys.vue"
import Mcp from "./views/Mcp.vue"
import AiSettings from "./views/AiSettings.vue"

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: ApiLayout,
      children: [
        { path: "", redirect: "/mcp" },
        { path: 'mcp', name: 'api-mcp', component: Mcp },
        { path: 'ai', name: 'api-ai', component: AiSettings },
        { path: "history", name: "api-history", component: ApiHistory },
        { path: "keys", name: "api-keys", component: ApiKeys },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/mcp" },
  ],
})