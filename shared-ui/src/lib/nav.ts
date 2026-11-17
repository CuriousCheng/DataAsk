/**
 * 七个前端工程在网关（5200）下的路径前缀。
 * 通过网关访问时都是同源，直接改 location 即可；token 在 cookie 里自动带过去。
 */
import { apiBase } from './api'

export const PATHS = {
  home: '/home/',
  modeling: '/modeling/',
  knowledge: '/knowledge/file-explorer',
  api: '/api-management/history',
  projectSettings: '/settings/project/general',
  orgSettings: '/settings/organization/general',
  userSettings: '/settings/user/profile',
  agentSettings: '/settings/agent/skills',
  security: '/settings/project/data-security',
} as const

export type NavKey = '首页' | '建模' | '知识' | 'API' | '数据安全'

export const NAV_ITEMS: NavKey[] = ['首页', '建模', '知识', 'API', '数据安全']

/** 网关端口；各工程 dev server 端口不算 */
export const GATEWAY_PORT = '5200'

const DEV_PORTS = ['5280', '5281', '5282', '5283', '5284', '5285', '5286']

/**
 * 把网关路径变成当前环境下能用的绝对地址。
 *
 * 正常情况下（在 5200 上）原样返回；
 * 但如果你直接开的是某个 dev 端口（5280-5286），同源跳转会 404，
 * 这时补上 5200 的网关地址，避免跳到 /home 这种本工程没有的路径。
 */
export function link(path: string): string {
  if (typeof window === 'undefined') return path
  const { protocol, hostname, port } = window.location
  if (port && DEV_PORTS.includes(port)) {
    return protocol + '//' + hostname + ':' + GATEWAY_PORT + path
  }
  return path
}

/** 同源跳转（走网关） */
export function go(path: string) {
  window.location.href = link(path)
}

/** 顶栏点击：返回 true 表示已处理（跳走了），false 表示该页还没做 */
export function goNav(label: NavKey): boolean {
  if (label === '首页') {
    go(PATHS.home)
    return true
  }
  if (label === '建模') {
    go(PATHS.modeling)
    return true
  }
  if (label === '知识') {
    go(PATHS.knowledge)
    return true
  }
  if (label === 'API') {
    go(PATHS.api)
    return true
  }
  if (label === '数据安全') {
    go(PATHS.security)
    return true
  }
  return false
}

export function goProjectSettings() {
  go(PATHS.projectSettings)
}

export function goOrgSettings() {
  go(PATHS.orgSettings)
}

export function goUserSettings(path: string = PATHS.userSettings) {
  go(path)
}

/** wren-console 原版控制台（8000）与 Trino UI（8888）的地址，从后端地址推导 */
export function consoleUrl(): string {
  try {
    return new URL(apiBase()).origin
  } catch {
    return 'http://192.168.159.128:8000'
  }
}

export function trinoUrl(): string {
  try {
    const u = new URL(apiBase())
    return `${u.protocol}//${u.hostname}:8888/ui/`
  } catch {
    return 'http://192.168.159.128:8888/ui/'
  }
}
