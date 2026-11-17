<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Copy, ExternalLink, Link2, RefreshCw } from 'lucide-vue-next'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

interface ThreadItem {
  id: string
  title: string
  project: string
  count?: number
}

const threads = ref<ThreadItem[]>([])
const loading = ref(false)
const error = ref('')
const selected = ref('')
const token = ref('')
const busy = ref(false)

const project = computed(() => {
  try {
    return localStorage.getItem('dataask.project') || '汽车销售分析'
  } catch {
    return '汽车销售分析'
  }
})

const publicUrl = computed(() =>
  token.value ? location.origin + '/home/embed/' + token.value : '',
)

const iframeCode = computed(() =>
  publicUrl.value
    ? '<iframe src="' +
      publicUrl.value +
      '" style="width:100%;max-width:720px;height:640px;border:1px solid #e5e5e5;border-radius:10px" title="DataAsk"></iframe>'
    : '',
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get<{ items: ThreadItem[] }>(
      '/api/threads?project=' + encodeURIComponent(project.value),
    )
    threads.value = r.items || []
    if (threads.value.length && !selected.value) selected.value = threads.value[0].id
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function share() {
  if (!selected.value) {
    showToast('先选一个讨论串')
    return
  }
  busy.value = true
  try {
    const r = await http.post<{ token: string }>(
      '/api/threads/' + encodeURIComponent(selected.value) + '/share',
      {},
    )
    token.value = r.token
    showToast('已生成分享链接')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '生成失败')
  } finally {
    busy.value = false
  }
}

async function unshare() {
  if (!selected.value) return
  busy.value = true
  try {
    await http.del('/api/threads/' + encodeURIComponent(selected.value) + '/share')
    token.value = ''
    showToast('已取消分享')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '取消失败')
  } finally {
    busy.value = false
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('已复制')
  } catch {
    showToast('复制失败，手动选中')
  }
}

function preview() {
  if (publicUrl.value) window.open(publicUrl.value, '_blank')
}
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>内嵌讨论串</h1>
      <div class="actions">
        <button class="btn" type="button" :disabled="loading" @click="load">
          <RefreshCw :size="14" />
          刷新
        </button>
      </div>
    </div>

    <p class="desc">
      把一个讨论串生成公开只读链接，别人不用登录就能看问答和结果；再用 iframe 嵌到你的网站。
      当前业务：<b>{{ project }}</b>
    </p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <template v-else>
      <div class="row">
        <label>讨论串</label>
        <select v-model="selected" class="input">
          <option v-for="t in threads" :key="t.id" :value="t.id">
            {{ t.title }}（{{ t.count ?? 0 }} 条消息）
          </option>
        </select>
      </div>

      <p v-if="!threads.length" class="hint">这个业务还没有讨论串，先去首页提一个问题。</p>

      <div class="btns">
        <button
          class="btn btn-primary"
          type="button"
          :disabled="busy || !threads.length"
          @click="share"
        >
          <Link2 :size="14" />
          生成分享链接
        </button>
        <button class="btn" type="button" :disabled="busy || !token" @click="unshare">取消分享</button>
      </div>

      <template v-if="token">
        <h2>公开链接</h2>
        <div class="url-row">
          <code>{{ publicUrl }}</code>
          <button class="icon-btn" type="button" aria-label="复制" @click="copy(publicUrl)">
            <Copy :size="14" />
          </button>
          <button class="icon-btn" type="button" aria-label="预览" @click="preview">
            <ExternalLink :size="14" />
          </button>
        </div>

        <h2>嵌入代码</h2>
        <pre class="code">{{ iframeCode }}</pre>
        <button class="btn" type="button" @click="copy(iframeCode)">复制 iframe</button>

        <p class="hint">
          任何人拿到这个链接都能看，只读、不能提问。取消分享后链接立刻失效。
        </p>
      </template>
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
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
  margin: 22px 0 8px;
  font-size: 15px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.desc {
  margin: 8px 0 18px;
  font-size: 13px;
  color: var(--text-3);
  line-height: 1.8;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.row > label {
  flex: 0 0 64px;
  font-size: 13px;
  color: var(--text-2);
}

.btns {
  display: flex;
  gap: 10px;
}

.url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fafafa;
}

.url-row code {
  flex: 1;
  font-size: 12.5px;
  word-break: break-all;
}

.icon-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  color: var(--text-2);
}

.code {
  padding: 10px 12px;
  border-radius: 6px;
  background: #f7f8fa;
  border: 1px solid var(--line);
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  margin-bottom: 10px;
}

.hint {
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-4);
  line-height: 1.8;
}

.err {
  color: #cf1322;
  font-size: 13px;
}
</style>
