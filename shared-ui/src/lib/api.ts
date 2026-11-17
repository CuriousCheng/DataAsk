/**
 * 统一的 HTTP 客户端。
 * - baseURL 默认指向虚拟机上的 wren-console（192.168.159.128:8000）
 * - token 存在 cookie 里：cookie 不区分端口，七个前端（5280-5286）共享同一份登录态
 * - 401 统一抛 UnauthorizedError，由调用方跳登录
 */

const TOKEN_KEY = 'dataask_token'
const TOKEN_DAYS = 7

export function apiBase(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {}
  const v = env.VITE_API_BASE ?? ''
  // 同源部署（nginx / node 反代 /api）：显式写 same-origin
  if (v === 'same-origin') return ''
  return v || 'http://192.168.159.128:8000'
}

function readCookie(name: string): string {
  const raw = document.cookie || ''
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('=') || '')
  }
  return ''
}

export function getToken(): string {
  const fromCookie = readCookie(TOKEN_KEY)
  if (fromCookie) return fromCookie
  try {
    return localStorage.getItem('dataask.token') || ''
  } catch {
    return ''
  }
}

export function setToken(token: string) {
  try {
    if (token) {
      document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${
        TOKEN_DAYS * 86400
      }; SameSite=Lax`
      localStorage.setItem('dataask.token', token)
    } else {
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`
      localStorage.removeItem('dataask.token')
    }
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = '登录已过期') {
    super(401, message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${apiBase()}${path}`, { ...init, headers })
  } catch (e) {
    throw new ApiError(0, `连不上后端（${apiBase()}），确认服务是否在跑`, e)
  }

  if (res.status === 401) throw new UnauthorizedError()

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const detail = (data as { detail?: unknown } | null)?.detail
    throw new ApiError(res.status, typeof detail === 'string' ? detail : `请求失败（${res.status}）`, data)
  }
  return data as T
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
