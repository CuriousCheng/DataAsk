<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy, Plug, Terminal } from 'lucide-vue-next'
import { showToast } from '../lib/toast'

const HOST = '192.168.159.128'
const sseUrl = `http://${HOST}:9301/sse`
const httpUrl = `http://${HOST}:9300/mcp`

const clineJson = computed(() =>
  JSON.stringify(
    {
      mcpServers: {
        'wren-console': {
          url: sseUrl,
          disabled: false,
        },
      },
    },
    null,
    2,
  ),
)

const cursorJson = computed(() =>
  JSON.stringify(
    {
      mcpServers: {
        'wren-console': {
          url: httpUrl,
        },
      },
    },
    null,
    2,
  ),
)

const copied = ref('')

async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    showToast('已复制')
    setTimeout(() => {
      if (copied.value === key) copied.value = ''
    }, 1500)
  } catch {
    showToast('复制失败，手动选中吧')
  }
}

const TOOLS = [
  { name: 'list_projects', desc: '列出所有业务（项目）', args: '无' },
  { name: 'get_project_schema', desc: '取某个业务的所有模型、列、关系', args: 'project' },
  { name: 'ask', desc: '用自然语言提问，返回 SQL 和结果', args: 'question, project' },
]
</script>

<template>
  <div class="page">
    <h1>MCP 接入</h1>
    <p class="sub">
      把 DataAsk 的语义层接到 VSCode（Cline）、Cursor、Claude Desktop。网关本身<b>没有认证</b>，只在可信内网用。
    </p>

    <div class="cards">
      <div class="card">
        <div class="card-head">
          <Plug :size="16" />
          <span class="t">SSE（VSCode / Cline）</span>
        </div>
        <div class="url-row">
          <code>{{ sseUrl }}</code>
          <button class="icon-btn" type="button" aria-label="复制" @click="copy(sseUrl, 'sse')">
            <component :is="copied === 'sse' ? Check : Copy" :size="15" />
          </button>
        </div>
        <p class="hint">在 Cline 的 MCP 设置里填这个地址，或把下面 JSON 放进 cline_mcp_settings.json。</p>
        <pre class="code">{{ clineJson }}</pre>
        <button class="btn" type="button" @click="copy(clineJson, 'cline')">
          <component :is="copied === 'cline' ? Check : Copy" :size="14" />
          复制 JSON
        </button>
      </div>

      <div class="card">
        <div class="card-head">
          <Terminal :size="16" />
          <span class="t">Streamable HTTP（Cursor / Claude Desktop）</span>
        </div>
        <div class="url-row">
          <code>{{ httpUrl }}</code>
          <button class="icon-btn" type="button" aria-label="复制" @click="copy(httpUrl, 'http')">
            <component :is="copied === 'http' ? Check : Copy" :size="15" />
          </button>
        </div>
        <p class="hint">Cursor 的 MCP 配置里填这个地址。</p>
        <pre class="code">{{ cursorJson }}</pre>
        <button class="btn" type="button" @click="copy(cursorJson, 'cursor')">
          <component :is="copied === 'cursor' ? Check : Copy" :size="14" />
          复制 JSON
        </button>
      </div>
    </div>

    <h2>三个工具</h2>
    <table class="tbl">
      <thead>
        <tr>
          <th style="width: 220px">工具</th>
          <th>作用</th>
          <th style="width: 200px">参数</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in TOOLS" :key="t.name">
          <td><code>{{ t.name }}</code></td>
          <td>{{ t.desc }}</td>
          <td class="muted">{{ t.args }}</td>
        </tr>
      </tbody>
    </table>

    <p class="note">
      网关端口是启动参数：<code>GATEWAY_PORT=9300</code>（HTTP）、<code>GATEWAY_PORT=9301</code>（SSE）。
      地址里的主机名换成你实际部署的机器即可。
    </p>

    <div class="warnbox">
      <b>网关鉴权现状</b>
      <p>
        网关调用后端时用的是 API Key（环境变量 <code>WC_API_KEY</code>），所以不再需要在服务器上存管理员密码；
        吊销那个 key 网关就会立刻失效。
      </p>
      <p>
        但<b>网关本身仍然不校验客户端</b>——任何能访问 9300/9301 的人都能提问。只放在可信内网，
        要对外开放得在网关上再加一层（反代 + 认证）。
      </p>
    </div>
  </div>
</template>

<style scoped>
.page {
  flex: 1;
  min-width: 0;
  padding: 20px 24px;
  overflow: auto;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

.sub {
  margin: 6px 0 18px;
  font-size: 13px;
  color: var(--text-3);
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px 16px;
  background: #fff;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-2);
}

.card-head .t {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-1);
}

.url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
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
  margin: 8px 0 10px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #f7f8fa;
  border: 1px solid var(--line);
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  overflow: auto;
}

.hint {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 4px;
}

h2 {
  margin: 26px 0 10px;
  font-size: 15px;
  font-weight: 600;
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
  padding: 10px 12px;
  border-bottom: 1px solid #f2f2f2;
}

.muted {
  color: var(--text-3);
}

.warnbox {
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid #ffe0b2;
  border-radius: 8px;
  background: #fffbe6;
  font-size: 12.5px;
  color: #8c5a00;
}

.warnbox b {
  display: block;
  margin-bottom: 6px;
  color: #874d00;
}

.warnbox p {
  margin: 4px 0;
  line-height: 1.75;
}

.note {
  margin-top: 18px;
  font-size: 12.5px;
  color: var(--text-3);
  line-height: 1.8;
}
</style>
