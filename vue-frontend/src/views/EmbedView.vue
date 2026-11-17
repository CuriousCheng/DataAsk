<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '@dataask/shared-ui'

interface Msg {
  role: 'user' | 'assistant'
  content?: string
  sql?: string | null
  data?: { columns?: string[]; rows?: Record<string, unknown>[]; row_count?: number }
  ok?: boolean
  error?: string | null
}

interface SharedThread {
  id: string
  project: string
  title: string
  messages: Msg[]
}

const route = useRoute()
const thread = ref<SharedThread | null>(null)
const error = ref('')
const loading = ref(true)

async function load() {
  try {
    const token = String(route.params.token ?? '')
    const r = await http.get<{ ok: boolean; thread: SharedThread }>(
      '/api/public/threads/' + encodeURIComponent(token),
    )
    thread.value = r.thread
  } catch {
    error.value = '这个分享链接无效或已取消'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function cols(m: Msg) {
  return m.data?.columns ?? []
}

function rowsOf(m: Msg) {
  return (m.data?.rows ?? []).slice(0, 100)
}
</script>

<template>
  <div class="embed">
    <header class="head">
      <span class="brand">DataAsk</span>
      <span v-if="thread" class="title">{{ thread.title }}</span>
    </header>

    <div v-if="loading" class="state">加载中…</div>
    <div v-else-if="error" class="state">{{ error }}</div>

    <div v-else-if="thread" class="stream">
      <template v-for="(m, i) in thread.messages" :key="i">
        <div v-if="m.role === 'user'" class="msg user">
          <div class="bubble">{{ m.content }}</div>
        </div>
        <div v-else class="msg bot">
          <template v-if="m.ok">
            <p class="summary">返回 {{ m.data?.row_count ?? (m.data?.rows || []).length }} 行</p>
            <div v-if="cols(m).length" class="table-wrap">
              <table>
                <thead>
                  <tr><th v-for="c in cols(m)" :key="c">{{ c }}</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(r, ri) in rowsOf(m)" :key="ri">
                    <td v-for="c in cols(m)" :key="c">{{ r[c] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="err">{{ m.error || '查询失败' }}</div>
        </div>
      </template>
    </div>

    <footer class="foot">由 DataAsk 提供 · 只读分享</footer>
  </div>
</template>

<style scoped>
.embed {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  font-size: 13px;
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
}

.brand {
  font-weight: 600;
}

.title {
  color: #666;
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stream {
  flex: 1;
  padding: 14px;
  overflow: auto;
}

.msg {
  margin-bottom: 14px;
}

.msg.user .bubble {
  display: inline-block;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f3f4f6;
}

.summary {
  margin-bottom: 8px;
  color: #666;
  font-size: 12.5px;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}

th {
  position: sticky;
  top: 0;
  height: 32px;
  padding: 0 10px;
  text-align: left;
  font-weight: 500;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  color: #555;
}

td {
  padding: 7px 10px;
  border-bottom: 1px solid #f4f4f4;
}

.state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.err {
  color: #cf1322;
}

.foot {
  padding: 8px 14px;
  border-top: 1px solid #eee;
  color: #aaa;
  font-size: 11.5px;
}
</style>
