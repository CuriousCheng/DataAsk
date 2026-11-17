import { ref } from 'vue'

export const toastText = ref('')
let timer: number | undefined

export function showToast(text: string) {
  toastText.value = text
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    toastText.value = ''
  }, 1800)
}
