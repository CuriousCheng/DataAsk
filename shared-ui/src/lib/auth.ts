import { computed, ref } from 'vue'
import { http, setToken, getToken } from './api'

export interface CurrentUser {
  id: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

const user = ref<CurrentUser | null>(null)
const loading = ref(false)

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const canEdit = computed(() => user.value?.role === 'admin' || user.value?.role === 'editor')

  async function login(name: string, password: string) {
    loading.value = true
    try {
      const res = await http.post<{ token: string; user?: CurrentUser }>('/api/login', { name, password })
      setToken(res.token)
      user.value = res.user ?? (await fetchMe())
      return user.value
    } finally {
      loading.value = false
    }
  }

  async function fetchMe(): Promise<CurrentUser | null> {
    if (!getToken()) {
      user.value = null
      return null
    }
    try {
      const me = await http.get<CurrentUser>('/api/me')
      user.value = me
      return me
    } catch {
      user.value = null
      return null
    }
  }

  function logout() {
    setToken('')
    user.value = null
  }

  return { user, loading, isLoggedIn, isAdmin, canEdit, login, fetchMe, logout }
}
