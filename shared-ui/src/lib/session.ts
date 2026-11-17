import { ref } from 'vue'
import { setToken } from './api'
import { useAuth } from './auth'

const ready = ref(false)
let started = false

/**
 * 应用启动时调用一次：
 * 1) 从 URL 上取 token（跨端口跳转时带过来的）
 * 2) 存进本 origin 的 localStorage，并把 token 从地址栏抹掉
 * 3) 拉一次 /api/me 确定登录态
 */
export function useSession() {
  const { isLoggedIn, fetchMe } = useAuth()

  if (!started) {
    started = true
    try {
      const url = new URL(window.location.href)
      const t = url.searchParams.get('token')
      if (t) {
        setToken(t)
        url.searchParams.delete('token')
        window.history.replaceState({}, '', url.toString())
      }
    } catch {
      /* ignore */
    }
    fetchMe().finally(() => {
      ready.value = true
    })
  }

  return { ready, isLoggedIn }
}
