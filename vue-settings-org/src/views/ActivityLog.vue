<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
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
}

const items = ref<LogItem[]>([])
const loading = ref(false)
const error = ref('')
const tab = ref<'web' | 'api'>('web')

const filtered = computed(() =>
  items.value.filter((l) => (tab.value === 'api' ? l.via === 'apikey' : l.via !== 'apikey')),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get<{ items: LogItem[] }>('/api/logs?limit=300')
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
  if (!window.confirm('清空全部活动日志？')) return
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
      <h1>活动日志</h1>
      <div class="actions">
        <button class="btn" type="button" :disabled="loading" @click="load">
          <RefreshCw :size="14" />
          刷新
        </button>
        <button class="btn" type="button" @click="clearAll">清空</button>
      </div>
    </div>

    <div class="tabs">
      <button class="tab" type="button" :data-active="tab === 'web'" @click="tab = 'web'">
        网页活动
      </button>
      <button class="tab" type="button" :data-active="tab === 'api'" @click="tab = 'api'">
        API 活动
      </button>
    </div>

    <p class="sub">来自后端 <code>/api/logs</code>，保留最近 500 条。</p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <table v-else class="tbl">
      <thead>
        <tr>
          <th style="width: 170px">时间</th>
          <th style="width: 120px">用户</th>
          <th style="width: 150px">业务</th>
          <th>问题</th>
          <th style="width: 90px">结果</th>
          <th style="width: 80px">耗时</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in filtered" :key="l.id">
          <td class="muted">{{ fmt(l.ts) }}</td>
          <td>{{ l.user }}</td>
          <td class="muted">{{ l.project }}</td>
          <td class="q">{{ l.question }}</td>
          <td>
            <span :class="l.ok ? 'ok' : 'bad'">{{ l.ok ? '成功' : l.stage || '失败' }}</span>
          </td>
          <td class="muted">{{ l.ms ? l.ms + 'ms' : '—' }}</td>
        </tr>
        <tr v-if="!filtered.length">
          <td colspan="6" class="empty">这类活动还没有记录</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page {
  max-width: 1200px;
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
  gap: 8px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin: 14px 0 0;
}

.tab {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-2);
}

.tab[data-active='true'] {
  border-color: #3157c4;
  background: #eef3ff;
  color: #1d39c4;
}

.sub {
  margin: 10px 0 14px;
  font-size: 12.5px;
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
  max-width: 380px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted {
  color: var(--text-3);
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
  padding: 40px;
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
