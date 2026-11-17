/**
 * 设置页跳转：统一走网关（5200）下的路径。
 * 直接开 dev 端口（5280-5286）时，link() 会自动补上网关地址。
 */
import { link, PATHS } from '@dataask/shared-ui'

export function settingsUrl(path: string = PATHS.projectSettings) {
  return link(path)
}

export function openSettings(path?: string) {
  window.location.href = link(path || PATHS.projectSettings)
}

export function openAiLanguage() {
  openSettings(PATHS.projectSettings)
}

export function openOrgSettings() {
  window.location.href = link(PATHS.orgSettings)
}

export function openUserSettings(path: string = PATHS.userSettings) {
  window.location.href = link(path)
}
