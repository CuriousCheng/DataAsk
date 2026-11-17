<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { KeyRound, RefreshCw } from 'lucide-vue-next'
import { ApiError, http, link } from '@dataask/shared-ui'

interface ApiKey {
  id: string
  name: string
  role: string
  prefix: string
  created_at?: number
  last_used?: number | null
}

const items = ref<ApiKey[]>([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get<{ items: ApiKey[] }>('/api/keys')
    items.value = r.items || []
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function fmt(t?: number | null) {
  return t ? new Date(t * 1000).toLocaleString('zh-CN') : '—'
}

function goApi() {
  location.href = link('/api-management/keys')
}
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>API 密钥</h1>
      <div class="actions">
        <button class="btn" type="button" :disabled="loading" @click="load">
          <RefreshCw :size="14" />
          刷新
        </button>
        <button class="btn btn-primary" type="button" @click="goApi">去 API 页管理</button>
      </div>
    </div>

    <h2>组织 API 密钥</h2>
    <p class="desc">
      密钥是全局的（一个库统一管理），后端没有“按组织隔离”的概念。这里是只读视图；
      新建、删除在 <a href="/api-management/keys">API → API 密钥</a>。
    </p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <table v-else class="tbl">
      <thead>
        <tr>
          <th>名称</th>
          <th style="width: 170px">前缀</th>
          <th style="width: 100px">角色</th>
          <th style="width: 170px">创建时间</th>
          <th style="width: 170px">最后使用</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="k in items" :key="k.id">
          <td><b>{{ k.name }}</b></td>
          <td><code>{{ k.prefix }}…</code></td>
          <td>{{ k.role }}</td>
          <td class="muted">{{ fmt(k.created_at) }}</td>
          <td class="muted">{{ fmt(k.last_used) }}</td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="5" class="empty">
            <KeyRound :size="18" />
            还没有密钥
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
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

h2 {
  margin-top: 18px;
  font-size: 15px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.desc {
  margin: 6px 0 14px;
  font-size: 12.5px;
  color: var(--text-3);
  line-height: 1.8;
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

.muted {
  color: var(--text-3);
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
