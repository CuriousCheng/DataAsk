<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { ApiError, http } from '@dataask/shared-ui'
import { projectName } from '../lib/threads'

interface CubeItem {
  name: string
  base_object: string
  measures: string[]
  dimensions: string[]
  time_dimensions: string[]
}

interface CubeDetail {
  name: string
  base_object: string
  measures: { name: string; expression: string; type: string }[]
  dimensions: { name: string; expression: string; type: string }[]
  time_dimensions: { name: string; expression: string; type: string }[]
}

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const cubes = ref<CubeItem[]>([])
const detail = ref<CubeDetail | null>(null)
const cube = ref('')
const measures = ref<string[]>([])
const dims = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const result = ref<{ sql: string; columns: string[]; rows: Record<string, unknown>[]; row_count: number } | null>(null)

const base = () => '/api/projects/' + encodeURIComponent(projectName())

async function loadCubes() {
  try {
    const r = await http.get<{ ok: boolean; cubes: CubeItem[] }>(base() + '/cubes')
    cubes.value = r.cubes || []
    if (cubes.value.length) await pick(cubes.value[0].name)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '读取指标失败'
  }
}

async function pick(name: string) {
  cube.value = name
  result.value = null
  try {
    const r = await http.get<{ ok: boolean; data: CubeDetail }>(
      base() + '/cubes/' + encodeURIComponent(name) + '/json',
    )
    detail.value = r.data
    measures.value = (r.data.measures || []).slice(0, 1).map((m) => m.name)
    dims.value = []
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '读取指标详情失败'
  }
}

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

async function run() {
  if (!cube.value || !measures.value.length) {
    error.value = '至少选一个度量'
    return
  }
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const body: Record<string, unknown> = {
      cube: cube.value,
      measures: measures.value,
      dimensions: dims.value,
      limit: 200,
    }
    const r = await http.post<{
      ok: boolean
      sql?: string
      data?: { columns?: string[]; rows?: Record<string, unknown>[]; row_count?: number }
      error?: string
    }>(base() + '/cube', body)
    if (!r.ok) {
      error.value = r.error || '查询失败'
      return
    }
    result.value = {
      sql: r.sql || '',
      columns: r.data?.columns || [],
      rows: r.data?.rows || [],
      row_count: r.data?.row_count ?? (r.data?.rows || []).length,
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '查询失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    error.value = ''
    result.value = null
    if (!cubes.value.length) loadCubes()
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="dialog" role="dialog" aria-modal="true">
      <div class="head">
        <h3>指标查询</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="row">
        <label>指标</label>
        <select class="input" :value="cube" @change="pick(($event.target as HTMLSelectElement).value)">
          <option v-for="c in cubes" :key="c.name" :value="c.name">
            {{ c.name }}（{{ c.base_object }}）
          </option>
        </select>
        <span v-if="!cubes.length" class="hint">这个业务还没有指标，去「建模 → 指标」新建</span>
      </div>

      <div v-if="detail" class="row">
        <label>度量</label>
        <div class="chips">
          <button
            v-for="m in detail.measures"
            :key="m.name"
            class="chip"
            type="button"
            :data-on="measures.includes(m.name)"
            @click="measures = toggle(measures, m.name)"
          >
            {{ m.name }}
          </button>
        </div>
      </div>

      <div v-if="detail" class="row">
        <label>维度</label>
        <div class="chips">
          <button
            v-for="d in detail.dimensions"
            :key="d.name"
            class="chip"
            type="button"
            :data-on="dims.includes(d.name)"
            @click="dims = toggle(dims, d.name)"
          >
            {{ d.name }}
          </button>
          <span v-if="!detail.dimensions.length" class="hint">没有维度</span>
        </div>
      </div>

      <p v-if="error" class="err">{{ error }}</p>

      <div class="foot">
        <button class="btn btn-primary" type="button" :disabled="loading || !cubes.length" @click="run">
          {{ loading ? '查询中…' : '查询' }}
        </button>
        <span class="muted">走 cube 口径，比自由提问快</span>
      </div>

      <template v-if="result">
        <pre v-if="result.sql" class="sql">{{ result.sql }}</pre>
        <p class="muted">返回 {{ result.row_count }} 行</p>
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th v-for="c in result.columns" :key="c">{{ c }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in result.rows.slice(0, 100)" :key="i">
                <td v-for="c in result.columns" :key="c">{{ r[c] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.dialog {
  width: 760px;
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  border-radius: 10px;
  background: #fff;
  overflow: auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.head h3 {
  font-size: 16px;
  font-weight: 600;
}

.row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  align-items: flex-start;
}

.row > label {
  flex: 0 0 48px;
  padding-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.chip {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: #fff;
  font-size: 12.5px;
  cursor: pointer;
  color: var(--text-2);
}

.chip[data-on='true'] {
  border-color: #3157c4;
  background: #eef3ff;
  color: #1d39c4;
}

.foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.sql {
  padding: 10px 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  background: #f7f8fa;
  border: 1px solid var(--line);
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.table-wrap {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--line);
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tbl th {
  height: 36px;
  padding: 0 10px;
  text-align: left;
  font-weight: 500;
  background: #fafafa;
  border-bottom: 1px solid var(--line);
  color: var(--text-2);
}

.tbl td {
  padding: 8px 10px;
  border-bottom: 1px solid #f2f2f2;
}

.muted {
  font-size: 12.5px;
  color: var(--text-3);
}

.hint {
  font-size: 12px;
  color: var(--text-4);
}

.err {
  color: #cf1322;
  font-size: 12.5px;
  margin-bottom: 10px;
}
</style>
