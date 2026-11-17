<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, ChevronDown, ChevronRight, Loader2, MoreHorizontal } from 'lucide-vue-next'
import Composer from '../components/Composer.vue'
import { ApiError, http, useAuth } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'
import {
  askInThread,
  getThread,
  projectName as currentProject,
  type Thread,
  type ThreadMessage,
} from '../lib/threads'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const threadId = computed(() => String(route.params.threadId ?? ''))
const authName = computed(() => user.value?.name || 'admin')

const remote = ref<Thread | null>(null)
const loading = ref(false)
const failure = ref('')
const sqlOpen = ref<number[]>([])

const messages = computed<ThreadMessage[]>(() => remote.value?.messages ?? [])
const projectName = computed(() => remote.value?.project || currentProject())
const title = computed(() => remote.value?.title || '讨论串')

function cols(m: ThreadMessage) {
  return m.data?.columns ?? []
}

function rowsOf(m: ThreadMessage) {
  return (m.data?.rows ?? []).slice(0, 200)
}

function countOf(m: ThreadMessage) {
  return m.data?.row_count ?? (m.data?.rows ?? []).length
}

function toggleSql(i: number) {
  sqlOpen.value = sqlOpen.value.includes(i)
    ? sqlOpen.value.filter((x) => x !== i)
    : [...sqlOpen.value, i]
}

async function ask(question: string) {
  const q = question.trim()
  if (!q || loading.value) return
  loading.value = true
  failure.value = ''
  try {
    const res = await askInThread(threadId.value, q)
    remote.value = res.thread
  } catch (e) {
    failure.value = e instanceof ApiError ? e.message : '请求失败'
  } finally {
    loading.value = false
  }
}

async function load() {
  loading.value = true
  failure.value = ''
  remote.value = null
  try {
    const t = await getThread(threadId.value)
    remote.value = t
    const q = String(route.query.q ?? '')
    if (q && !(t.messages ?? []).length) {
      await ask(q)
      const clean = { ...route.query }
      delete clean.q
      router.replace({ path: route.path, query: clean })
    }
  } catch (e) {
    failure.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function saveArtifact(m: ThreadMessage) {
  try {
    await http.post('/api/artifacts', {
      thread_id: threadId.value,
      at: m.at,
      title: '',
    })
    showToast('已保存到人工制品库')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '保存失败')
  }
}

onMounted(load)
watch(threadId, load)
</script>

<template>
  <div class="thread">
    <header class="thread-head">
      <h1 class="thread-title">{{ title }}</h1>
      <div class="thread-actions">
        <span class="project-chip">{{ projectName }}</span>
        <button class="icon-btn" type="button" aria-label="更多">
          <MoreHorizontal :size="16" />
        </button>
      </div>
    </header>

    <div class="thread-scroll">
      <div class="thread-inner">
      <template v-for="(m, i) in messages" :key="i">
        <div v-if="m.role === 'user'" class="msg-user">
          <div class="user-meta">
            {{ authName }}
            <span class="online" />
          </div>
          <div class="bubble">{{ m.content }}</div>
        </div>

        <div v-else class="msg-assistant">
          <template v-if="m.ok">
            <button v-if="m.sql" class="steps" type="button" @click="toggleSql(i)">
              <component :is="sqlOpen.includes(i) ? ChevronDown : ChevronRight" :size="13" />
              查看生成的 SQL
            </button>
            <pre v-if="m.sql && sqlOpen.includes(i)" class="sql">{{ m.sql }}</pre>

            <p class="summary">
              查询返回 <strong>{{ countOf(m) }}</strong> 行<template v-if="cols(m).length">，{{ cols(m).length }} 列</template>。
            </p>

            <div class="art-row">
              <button class="link-btn" type="button" @click="saveArtifact(m)">保存为人工制品</button>
            </div>

            <div v-if="cols(m).length" class="table-wrap">
              <table class="answer-table">
                <thead>
                  <tr>
                    <th v-for="c in cols(m)" :key="c">{{ c }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, ri) in rowsOf(m)" :key="ri">
                    <td v-for="c in cols(m)" :key="c">{{ r[c] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <div v-else class="state error">
            <AlertCircle :size="16" />
            <span>{{ m.error || '这次查询失败了' }}</span>
          </div>
        </div>
      </template>

      <div v-if="loading" class="msg-assistant">
        <div class="state">
          <Loader2 :size="16" class="spin" />
          正在生成 SQL 并查询 Trino…
        </div>
      </div>

      <div v-if="failure && !loading" class="msg-assistant">
        <div class="state error">
          <AlertCircle :size="16" />
          <span>{{ failure }}</span>
        </div>
      </div>
      </div>
    </div>

    <div class="thread-composer">
      <Composer placeholder="提出后续问题以进一步探索你的数据" @submit="ask" />
    </div>
  </div>
</template>

<style scoped>
.thread {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.thread-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px 10px;
}

.thread-title {
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.project-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef3ff;
  color: #3157c4;
  font-size: 12px;
}

.anchor {
  position: relative;
}

.move-pop {
  top: 36px;
  right: 0;
  min-width: 180px;
}

.move-hint {
  padding: 4px 10px 6px;
  font-size: 12px;
  color: var(--text-3);
}

.art-row {
  margin: 6px 0 10px;
}

.link-btn {
  border: 0;
  background: transparent;
  color: #3157c4;
  font-size: 12.5px;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}

.thread-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.thread-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 8px 24px 24px;
}

.msg-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin: 12px 0 26px;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.online {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #37b24d;
}

.bubble {
  max-width: 70%;
  padding: 9px 14px;
  border-radius: 12px;
  background: #f2f2f2;
  font-size: 14px;
  line-height: 1.6;
}

.msg-assistant {
  font-size: 14px;
  line-height: 1.75;
}

.state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 0;
  color: var(--text-2);
}

.state.error {
  color: #cf1322;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.steps {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 10px 0;
  font-size: 12px;
  color: var(--text-3);
}

.steps:hover {
  color: var(--text);
}

.sql {
  margin: 6px 0 12px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #f7f7f7;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-x: auto;
}

.summary {
  margin: 8px 0;
}

.table-wrap {
  margin: 10px 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: auto;
  max-height: 520px;
}

.answer-table {
  border-collapse: collapse;
  font-size: 13px;
  width: 100%;
}

.answer-table th {
  position: sticky;
  top: 0;
  height: 36px;
  padding: 0 14px;
  text-align: left;
  font-weight: 500;
  color: var(--text-2);
  background: #fafafa;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.answer-table td {
  height: 34px;
  padding: 0 14px;
  border-bottom: 1px solid #f2f2f2;
  white-space: nowrap;
}

.thread-composer {
  flex: 0 0 auto;
  padding: 8px 24px 20px;
}

.thread-composer :deep(.composer) {
  max-width: 860px;
  margin: 0 auto;
}
</style>