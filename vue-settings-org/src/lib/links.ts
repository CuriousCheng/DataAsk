import { link, PATHS } from '@dataask/shared-ui'

export function goHome() {
  window.location.href = link(PATHS.home)
}

export function goProjectSettings() {
  window.location.href = link(PATHS.projectSettings)
}
