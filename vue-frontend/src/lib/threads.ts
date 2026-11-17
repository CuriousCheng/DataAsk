import { http } from '@dataask/shared-ui'

export interface ThreadMessage {
  role: 'user' | 'assistant'
  content?: string
  sql?: string | null
  data?: {
    columns?: string[]
    rows?: Record<string, unknown>[]
    row_count?: number
    truncated?: boolean
  }
  ok?: boolean
  error?: string | null
  stage?: string | null
  at?: number
}

export interface Thread {
  id: string
  project: string
  title: string
  created_at?: number
  updated_at?: number
  created_by?: string
  count?: number
  messages?: ThreadMessage[]
}

export interface AskResult {
  ok: boolean
  sql?: string
  data?: ThreadMessage['data']
  error?: string
  stage?: string
}

export function projectName(): string {
  try {
    return localStorage.getItem('dataask.project') || '汽车销售分析'
  } catch {
    return '汽车销售分析'
  }
}

export async function listThreads(project = projectName()): Promise<Thread[]> {
  const r = await http.get<{ items: Thread[] }>(
    '/api/threads?project=' + encodeURIComponent(project),
  )
  return r.items || []
}

export async function createThread(project = projectName(), title = ''): Promise<Thread> {
  const r = await http.post<{ thread: Thread }>('/api/threads', { project, title })
  return r.thread
}

export async function getThread(id: string): Promise<Thread> {
  const r = await http.get<{ thread: Thread }>('/api/threads/' + encodeURIComponent(id))
  return r.thread
}

export async function renameThread(id: string, title: string): Promise<void> {
  await http.patch('/api/threads/' + encodeURIComponent(id), { title })
}

export async function deleteThread(id: string): Promise<void> {
  await http.del('/api/threads/' + encodeURIComponent(id))
}

export async function askInThread(
  id: string,
  question: string,
): Promise<{ result: AskResult; thread: Thread }> {
  return http.post<{ result: AskResult; thread: Thread }>(
    '/api/threads/' + encodeURIComponent(id) + '/ask',
    { question },
  )
}
