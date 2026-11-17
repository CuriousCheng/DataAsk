import { reactive, watch } from 'vue'

export interface ApiKey {
  id: string
  name: string
  value: string
  createdAt: string
  lastUsedAt: string
  creator: string
}

interface State {
  keys: ApiKey[]
}

const KEY = 'dataask.api.v1'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { keys: [] }
    return JSON.parse(raw) as State
  } catch {
    return { keys: [] }
  }
}

export const api = reactive<State>(load())

watch(
  api,
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)
