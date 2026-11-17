<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowUpRight, Search, Trash2 } from 'lucide-vue-next'
import DateRangePicker from '../components/DateRangePicker.vue'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'
import { projectName } from '../lib/threads'

interface Artifact {
  id: string
  title: string
  project: string
  thread_id: string
  question: string
  sql: string
  columns: string[]
  row_count: number
  created_at: number
  created_by: string
  rows?: Record<string, unknown>[]
}

const keyword = ref('')
const applied = ref('')
const items = ref<Artifact[]>([])
const loading = ref(false)
const error = ref('')
const range = ref<{ start: Date | null; end: Date | null }>({ start: null, end: null })
const open = ref<Artifact | null>(null)

const filtered = computed(() => {
  let list = items.value
  if (range.value.start && range.value.end) {
    const s = range.value.start.getTime() / 1000
    const e = range.value.end.getTime() / 1000 + 86399
    list = list.filter((a) => a.created_at >= s && a.created_at <= e)
  }
  return list
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const q = applied.value ? '?q=' + encodeURIComponent(applied.value) : ''
    const r = await http.get<{ items: Artifact[] }>('/api/artifacts' + q)
    items.value = r.items || []
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function search() {
  applied.value = keyword.value.trim()
  load()
}

function onRange(r: { start: Date | null; end: Date | null }) {
  range.value = r
}

async function openOne(a: Artifact) {
  try {
    const r = await http.get<{ artifact: Artifact }>('/api/artifacts/' + a.id)
    open.value = r.artifact
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '读取失败')
  }
}

async function remove(a: Artifact) {
  if (!window.confirm('删除人工制品「' + a.title + '」？')) return
  try {
    await http.del('/api/artifacts/' + a.id)
    showToast('已删除')
    if (open.value?.id === a.id) open.value = null
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '删除失败')
  }
}

function fmt(t: number) {
  return new Date(t * 1000).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="artifacts">
    <div class="artifacts-head">
      <h1>人工制品库</h1>

      <div class="filters">
        <span class="filter-label">筛选条件：</span>
        <DateRangePicker @change="onRange" />
        <div class="search">
          <input
            v-model="keyword"
            class="input"
            placeholder="搜索人工制品"
            @keyup.enter="search"
          />
          <button class="search-btn" type="button" aria-label="搜索" @click="search">
            <Search :size="15" />
          </button>
        </div>
      </div>
    </div>

    <p class="scope">当前业务：{{ projectName() }}｜共 {{ filtered.length }} 个</p>
    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <div v-else-if="!filtered.length" class="empty">
      <svg width="84" height="64" viewBox="0 0 84 64" fill="none" aria-hidden="true">
        <rect x="22" y="10" width="34" height="42" rx="4" fill="#e9e9e9" />
        <rect x="26" y="16" width="26" height="4" rx="2" fill="#c9c9c9" />
        <rect x="26" y="24" width="26" height="4" rx="2" fill="#c9c9c9" />
        <rect x="26" y="32" width="16" height="4" rx="2" fill="#c9c9c9" />
        <path d="M18 52h42l6 8H12l6-8Z" fill="#dcdcdc" />
        <path d="M56 6h12a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-4l-4 4v-4h-4a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z" fill="#ededed" />
      </svg>
      <p>尚未有任何人工制品——请在讨论串中创建，创建后就会显示在这里。</p>
    </div>

    <div v-else class="grid">
      <button v-for="a in filtered" :key="a.id" class="card" type="button" @click="openOne(a)">
        <div class="card-title">{{ a.title }}</div>
        <div class="card-q">{{ a.question }}</div>
        <div class="card-meta">{{ a.row_count }} 行 · {{ fmt(a.created_at) }}</div>
        <span class="card-open"><ArrowUpRight :size="14" /></span>
      </button>
    </div>

    <div v-if="open" class="overlay" @mousedown.self="open = null">
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="dialog-head">
          <h3>{{ open.title }}</h3>
          <button class="btn btn-sm" type="button" @click="open = null">关闭</button>
        </div>
        <p class="q">{{ open.question }}</p>
        <pre v-if="open.sql" class="sql">{{ open.sql }}</pre>
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th v-for="c in open.columns" :key="c">{{ c }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in (open.rows || []).slice(0, 100)" :key="i">
                <td v-for="c in open.columns" :key="c">{{ r[c] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="dialog-foot">
          <span class="muted">{{ open.row_count }} 行 · {{ open.created_by }} · {{ fmt(open.created_at) }}</span>
          <span style="flex: 1" />
          <button class="btn danger" type="button" @click="remove(open)">
            <Trash2 :size="13" />
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.artifacts {
  flex: 1;
  min-width: 0;
  padding: 20px 24px;
  overflow: auto;
}

.artifacts-head {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 13px;
  color: var(--text-2);
}

.search {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  color: var(--text-2);
}

.scope {
  margin: 10px 0 16px;
  font-size: 12.5px;
  color: var(--text-3);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.card:hover {
  border-color: #adc6ff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
}

.card-q {
  font-size: 12.5px;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  font-size: 12px;
  color: var(--text-4);
}

.card-open {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--text-4);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 80px 20px;
  color: var(--text-3);
  font-size: 13px;
}

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
  width: 780px;
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  border-radius: 10px;
  background: #fff;
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.dialog-head h3 {
  font-size: 16px;
  font-weight: 600;
}

.q {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 10px;
}

.sql {
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 6px;
  background: #f7f8fa;
  border: 1px solid var(--line);
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--line);
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tbl th {
  position: sticky;
  top: 0;
  height: 38px;
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

.dialog-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
}

.muted {
  font-size: 12px;
  color: var(--text-3);
}

.danger {
  color: #cf1322;
  border-color: #ffccc7;
}

.btn-sm {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
}

.err {
  color: #cf1322;
  font-size: 13px;
}

.hint {
  font-size: 13px;
  color: var(--text-3);
}
</style>
