import { createRouter, createWebHistory } from 'vue-router'
import General from './views/General.vue'
import Members from './views/Members.vue'
import ActivityLog from './views/ActivityLog.vue'
import ApiKeys from './views/ApiKeys.vue'
import Mcp from './views/Mcp.vue'
import UsersAdmin from './views/UsersAdmin.vue'
import SystemSettings from './views/SystemSettings.vue'
import DangerZone from './views/DangerZone.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/general' },
    { path: '/general', name: 'org-general', component: General },
    { path: '/members', name: 'org-members', component: Members },
    { path: '/users', name: 'org-users', component: UsersAdmin },
    { path: '/activity-log', name: 'org-activity', component: ActivityLog },
    { path: '/api-keys', name: 'org-api-keys', component: ApiKeys },
    { path: '/mcp', name: 'org-mcp', component: Mcp },
    { path: '/system', name: 'org-system', component: SystemSettings },
    { path: '/danger-zone', name: 'org-danger', component: DangerZone },
    { path: '/:pathMatch(.*)*', redirect: '/general' },
  ],
})