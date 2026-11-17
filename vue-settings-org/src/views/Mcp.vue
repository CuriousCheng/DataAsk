<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Copy, ExternalLink } from 'lucide-vue-next'
import { ApiError, http, link } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

const HOST = '192.168.159.128'
const sseUrl = `http://${HOST}:9301/sse`
const httpUrl = `http://${HOST}:9300/mcp`

interface Org {
  id: string
  name: string
  members?: { user: string; role: string }[]
}

const org = ref<Org | null>(null)
const error = ref('')

const snippet = computed(() =>
  JSON.stringify({ mcpServers: { 'wren-console': { url: sseUrl, disabled: false } } }, null, 2),
)

async function load() {
  try {
    const r = await http.get<{ items: Org[] }>('/api/orgs')
    org.value = (r.items || [])[0] ?? null
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  }
}

onMounted(load)

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('已复制')
  } catch {
    showToast('复制失败，手动选中')
  }
}

function goApi() {
  location.href = link('/api-management/mcp')
}
</script>

<template>
  <div class="page">
    <h1>为该组织启用 MCP</h1>
    <p class="desc">
      让外部 AI 客户端（Claude、Cursor、VSCode/Cline）通过网关连接你的语义层。
      网关是全局的，后端没有按组织隔离的开关；组织信息只用于说明。
    </p>

    <p v-if="error" class="err">{{ error }}</p>

    <h2>连接</h2>
    <div class="urls">
      <div class="url-row">
        <span class="label">SSE（VSCode / Cline）</span>
        <code>{{ sseUrl }}</code>
        <button class="icon-btn" type="button" aria-label="复制" @click="copy(sseUrl)">
          <Copy :size="14" />
        </button>
      </div>
      <div class="url-row">
        <span class="label">Streamable HTTP（Cursor / Claude）</span>
        <code>{{ httpUrl }}</code>
        <button class="icon-btn" type="button" aria-label="复制" @click="copy(httpUrl)">
          <Copy :size="14" />
        </button>
      </div>
    </div>

    <pre class="code">{{ snippet }}</pre>

    <h2>已公开的项目</h2>
    <p class="desc">
      网关会把所有业务都暴露给客户端（没有“只公开某几个”的开关）。
      当前组织：{{ org?.name || '—' }}。
    </p>
    <button class="btn" type="button" @click="goApi">
      查看 MCP 接入说明
      <ExternalLink :size="13" />
    </button>

    <p class="hint">网关本身不做客户端鉴权，只放可信内网；调用后端用的是 WC_API_KEY。</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

h2 {
  margin: 22px 0 10px;
  font-size: 15px;
  font-weight: 600;
}

.desc {
  margin: 6px 0 8px;
  font-size: 13px;
  color: var(--text-3);
  line-height: 1.8;
}

.urls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.url-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fafafa;
}

.label {
  flex: 0 0 230px;
  font-size: 12.5px;
  color: var(--text-2);
}

.url-row code {
  flex: 1;
  font-size: 12.5px;
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
  margin: 12px 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: #f7f8fa;
  border: 1px solid var(--line);
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
}

.hint {
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-4);
}

.err {
  color: #cf1322;
  font-size: 13px;
}
</style>
