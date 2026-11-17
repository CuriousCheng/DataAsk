import { reactive } from 'vue'
import { http } from '@dataask/shared-ui'

export type ColType = 'INT64' | 'STRING' | 'DATE'

export interface Column {
  name: string
  alias: string
  type: ColType
  description: string
  primary?: boolean
}

export interface Relation {
  id: string
  name: string
  fromModel: string
  fromColumn: string
  toModel: string
  toColumn: string
  type: '多对一' | '一对多' | '一对一'
  description: string
}

export interface Model {
  name: string
  alias: string
  description: string
  columns: Column[]
  x: number
  y: number
  expanded: boolean
}

export type LayoutMode = '从左到右' | '网格' | '轨道'

interface State {
  models: Model[]
  relations: Relation[]
  layout: LayoutMode
  loading: boolean
  error: string
  project: string
}

export const modeling = reactive<State>({
  models: [],
  relations: [],
  layout: '从左到右',
  loading: false,
  error: '',
  project: '',
})

interface ApiColumn {
  name: string
  type: string
  properties?: { description?: string; alias?: string }
  is_primary_key?: boolean
}

interface ApiModelDetail {
  name: string
  properties?: { description?: string }
  columns?: ApiColumn[]
  primary_key?: string
}

interface ApiRelation {
  name: string
  models: string[]
  join_type: string
  condition: string
}

function mapType(t: string): ColType {
  const v = (t || '').toUpperCase()
  if (v.includes('INT') || v.includes('DECIMAL') || v.includes('DOUBLE') || v.includes('NUMERIC')) return 'INT64'
  if (v.includes('DATE') || v.includes('TIME')) return 'DATE'
  return 'STRING'
}

function mapJoin(t: string): Relation['type'] {
  const v = (t || '').toUpperCase()
  if (v === 'ONE_TO_ONE') return '一对一'
  if (v === 'ONE_TO_MANY') return '一对多'
  return '多对一'
}

function splitCondition(cond: string): { left: string; right: string } {
  const parts = (cond || '').split('=')
  return { left: (parts[0] || '').trim(), right: (parts[1] || '').trim() }
}

export function projectName(): string {
  try {
    return localStorage.getItem('dataask.project') || '汽车销售分析'
  } catch {
    return '汽车销售分析'
  }
}

export function applyLayout(mode: LayoutMode) {
  modeling.layout = mode
  const models = modeling.models
  if (mode === '网格') {
    const cols = 3
    models.forEach((m, i) => {
      m.x = 80 + (i % cols) * 340
      m.y = 60 + Math.floor(i / cols) * 360
    })
    return
  }
  if (mode === '轨道') {
    models.forEach((m, i) => {
      m.x = 80 + i * 300
      m.y = 120 + (i % 2 === 0 ? 0 : 160)
    })
    return
  }
  models.forEach((m, i) => {
    m.x = 60 + (i % 3) * 340
    m.y = 40 + Math.floor(i / 3) * 400
  })
}

export function relationsOf(name: string) {
  return modeling.relations.filter((r) => r.fromModel === name || r.toModel === name)
}

export function nodeHeight(m: Model) {
  if (!m.expanded) return 36
  return 52 + m.columns.length * 26 + 30 + 26 + Math.max(1, relationsOf(m.name).length) * 26
}

/** 从后端加载某个项目的模型与关系 */
export async function loadProject(name = projectName()) {
  modeling.loading = true
  modeling.error = ''
  modeling.project = name
  try {
    const list = await http.get<{ items: { name: string; description?: string }[] }>(
      `/api/projects/${encodeURIComponent(name)}/models`,
    )
    const details = await Promise.all(
      (list.items || []).map((it) =>
        http
          .get<{ ok: boolean; data: ApiModelDetail }>(
            `/api/projects/${encodeURIComponent(name)}/models/${encodeURIComponent(it.name)}/json`,
          )
          .then((r) => r.data)
          .catch(() => null),
      ),
    )

    const models: Model[] = (list.items || []).map((it, i) => {
      const d = details[i]
      const columns: Column[] = (d?.columns || []).map((c) => ({
        name: c.name,
        alias: c.properties?.alias || c.name,
        type: mapType(c.type),
        description: c.properties?.description || '',
        primary: c.is_primary_key || d?.primary_key === c.name,
      }))
      return {
        name: it.name,
        alias: it.name,
        description: d?.properties?.description || it.description || '',
        columns,
        x: 0,
        y: 0,
        expanded: true,
      }
    })

    const relRes = await http
      .get<{ ok: boolean; data: { relationships: ApiRelation[] } }>(
        `/api/projects/${encodeURIComponent(name)}/relationships/json`,
      )
      .catch(() => null)

    const relations: Relation[] = (relRes?.data?.relationships || []).map((r, i) => {
      const { left, right } = splitCondition(r.condition)
      const [lm, lc] = left.split('.')
      const [rm, rc] = right.split('.')
      return {
        id: `r-${i}`,
        name: r.name,
        fromModel: lm || r.models?.[0] || '',
        fromColumn: lc || '',
        toModel: rm || r.models?.[1] || '',
        toColumn: rc || '',
        type: mapJoin(r.join_type),
        description: r.condition,
      }
    })

    modeling.models = models
    modeling.relations = relations
    applyLayout(modeling.layout)
  } catch (e) {
    modeling.error = e instanceof Error ? e.message : '加载失败'
  } finally {
    modeling.loading = false
  }
}
