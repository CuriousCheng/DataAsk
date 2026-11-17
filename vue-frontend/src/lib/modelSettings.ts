import { reactive } from 'vue'
import { http } from '@dataask/shared-ui'

/** 后端 /api/ai 的真实配置：协议、地址、模型、是否已存 key */
export const ai = reactive({
  protocol: 'openai' as 'openai' | 'anthropic',
  base_url: '',
  model: '',
  has_key: false,
  models: [] as string[],
  loaded: false,
  probing: false,
  saving: false,
  error: '',
})

export function isLocal(): boolean {
  const u = ai.base_url.toLowerCase()
  return (
    u.includes('localhost') ||
    u.includes('127.0.0.1') ||
    u.includes('0.0.0.0') ||
    u.includes('192.168.') ||
    u.includes('host.docker.internal')
  )
}

export function providerLabel(): string {
  if (!ai.base_url) return '未配置'
  return (isLocal() ? '本地' : '云端') + ' · ' + ai.protocol
}

export async function loadAi(): Promise<void> {
  try {
    const r = await http.get<{
      protocol: string
      base_url: string
      model: string
      has_key: boolean
    }>('/api/ai')
    ai.protocol = (r.protocol as 'openai' | 'anthropic') || 'openai'
    ai.base_url = r.base_url || ''
    ai.model = r.model || ''
    ai.has_key = !!r.has_key
    ai.error = ''
  } catch (e) {
    ai.error = e instanceof Error ? e.message : '读取 AI 配置失败'
  } finally {
    ai.loaded = true
  }
}

/** 探测已保存配置能返回哪些模型（POST /api/ai/test-saved） */
export async function probeModels(): Promise<void> {
  ai.probing = true
  ai.error = ''
  try {
    const r = await http.post<{ ok: boolean; models?: string[]; error?: string }>(
      '/api/ai/test-saved',
      {},
    )
    if (!r.ok) {
      ai.error = r.error || '探测失败'
      ai.models = []
      return
    }
    ai.models = r.models || []
    if (!ai.models.length) ai.error = '连上了，但接口没返回模型列表'
  } catch (e) {
    ai.error = e instanceof Error ? e.message : '探测失败'
    ai.models = []
  } finally {
    ai.probing = false
  }
}

/** 切换模型（写回后端 /api/ai） */
export async function setModel(model: string): Promise<void> {
  if (!model || model === ai.model) return
  ai.saving = true
  ai.error = ''
  try {
    await http.put('/api/ai', { model })
    ai.model = model
  } catch (e) {
    ai.error = e instanceof Error ? e.message : '切换模型失败'
  } finally {
    ai.saving = false
  }
}

export async function ensureAi(): Promise<void> {
  if (!ai.loaded) await loadAi()
}
