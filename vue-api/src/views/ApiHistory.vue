<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Link2, RefreshCw } from 'lucide-vue-next'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

interface LogItem {
  id: string
  ts: number
  user: string
  via?: string
  project: string
  question: string
  ok: boolean
  stage?: string
  ms?: number
  sql?: string
  thread?: string
}

const items = ref<LogItem[]>([])
const loading = ref(false)
const error = ref('')
const onlyFailed = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get<{ items: LogItem[] }>(
      '/api/logs?limit=200' + (onlyFailed.value ? '&only_failed=true' : ''),
    )
    items.value = r.items || []
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function fmt(t: number) {
  return new Date(t * 1000).toLocaleString('zh-CN')
}

async function clearAll() {
  if (!window.confirm('清空全部调用记录？')) return
  try {
    await http.del('/api/logs')
    showToast('已清空')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '清空失败')
  }
}
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>API 历史记录</h1>
      <div class="actions">
        <label class="check">
          <input v-model="onlyFailed" type="checkbox" @change="load" />
          只看失败
        </label>
        <button class="btn" type="button" :disabled="loading" @click="load">
          <RefreshCw :size="14" />
          刷新
        </button>
        <button class="btn" type="button" @click="clearAll">清空</button>
      </div>
    </div>
    <p class="sub">每次通过网页或 MCP 提问都会记一条（保留最近 500 条）。</p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <table v-else class="tbl">
      <thead>
        <tr>
          <th style="width: 170px">时间</th>
          <th style="width: 120px">调用者</th>
          <th style="width: 140px">业务</th>
          <th>问题</th>
          <th style="width: 90px">结果</th>
          <th style="width: 80px">耗时</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in items" :key="l.id">
          <td class="muted">{{ fmt(l.ts) }}</td>
          <td>
            {{ l.user }}
            <span v-if="l.via === 'apikey'" class="tag">key</span>
          </td>
          <td class="muted">{{ l.project }}</td>
          <td class="q" :title="l.question">{{ l.question }}</td>
          <td>
            <span :class="l.ok ? 'ok' : 'bad'">{{ l.ok ? '成功' : l.stage || '失败' }}</span>
          </td>
          <td class="muted">{{ l.ms ? l.ms + 'ms' : '—' }}</td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="6" class="empty">
            <Link2 :size="18" />
            还没有调用记录
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page {
  flex: 1;
  min-width: 0;
  padding: 20px 24px;
  overflow: auto;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--text-2);
}

.sub {
  margin: 6px 0 16px;
  font-size: 13px;
  color: var(--text-3);
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: 1px solid var(--line);
  background: #fff;
}

.tbl th {
  height: 40px;
  padding: 0 12px;
  text-align: left;
  font-weight: 500;
  color: var(--text-2);
  background: #fafafa;
  border-bottom: 1px solid var(--line);
}

.tbl td {
  padding: 9px 12px;
  border-bottom: 1px solid #f2f2f2;
}

.q {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted {
  color: var(--text-3);
}

.tag {
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 3px;
  background: #eef3ff;
  color: #1d39c4;
  font-size: 10.5px;
}

.ok {
  color: #389e0d;
}

.bad {
  color: #cf1322;
}

.empty {
  text-align: center;
  color: var(--text-4);
  padding: 44px;
}

.err {
  color: #cf1322;
  font-size: 13px;
}

.hint {
  font-size: 12.5px;
  color: var(--text-3);
}
</style>
