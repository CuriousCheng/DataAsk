<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import Modal from '../components/Modal.vue'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

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

const createOpen = ref(false)
const name = ref('')
const role = ref('viewer')
const secret = ref('')

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

async function create() {
  if (!name.value.trim()) {
    showToast('先填名字')
    return
  }
  try {
    const r = await http.post<{ key: ApiKey; secret: string }>('/api/keys', {
      name: name.value.trim(),
      role: role.value,
    })
    secret.value = r.secret
    name.value = ''
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '创建失败')
  }
}

async function remove(k: ApiKey) {
  if (!window.confirm('删除 key「' + k.name + '」？用它调用的客户端会立刻失效。')) return
  try {
    await http.del('/api/keys/' + k.id)
    showToast('已删除')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '删除失败')
  }
}

function fmt(t?: number | null) {
  if (!t) return '—'
  return new Date(t * 1000).toLocaleString('zh-CN')
}

async function copySecret() {
  try {
    await navigator.clipboard.writeText(secret.value)
    showToast('已复制')
  } catch {
    showToast('复制失败，手动选中')
  }
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
        <button class="btn btn-primary" type="button" @click="createOpen = true">
          <Plus :size="14" />
          新建密钥
        </button>
      </div>
    </div>
    <p class="sub">
      给 MCP 网关、脚本、第三方用。请求头带 <code>X-API-Key: &lt;key&gt;</code> 即可，明文只在创建时显示一次。
    </p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <table v-else class="tbl">
      <thead>
        <tr>
          <th>名称</th>
          <th style="width: 180px">前缀</th>
          <th style="width: 100px">角色</th>
          <th style="width: 170px">创建时间</th>
          <th style="width: 170px">最近使用</th>
          <th style="width: 80px" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="k in items" :key="k.id">
          <td><b>{{ k.name }}</b></td>
          <td><code>{{ k.prefix }}…</code></td>
          <td>{{ k.role }}</td>
          <td class="muted">{{ fmt(k.created_at) }}</td>
          <td class="muted">{{ fmt(k.last_used) }}</td>
          <td>
            <button class="btn btn-sm danger" type="button" @click="remove(k)">
              <Trash2 :size="12" />
            </button>
          </td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="6" class="empty">
            <KeyRound :size="18" />
            还没有密钥
          </td>
        </tr>
      </tbody>
    </table>

    <Modal
      :open="createOpen"
      title="新建 API 密钥"
      width="520px"
      @close="createOpen = false; secret = ''"
    >
      <template v-if="!secret">
        <div class="row">
          <label>名称</label>
          <input v-model="name" class="input" placeholder="例如 vscode-cline" />
        </div>
        <div class="row">
          <label>角色</label>
          <select v-model="role" class="input">
            <option value="viewer">viewer（只读提问）</option>
            <option value="editor">editor（可建模）</option>
            <option value="admin">admin（全部）</option>
          </select>
        </div>
        <p class="hint">角色决定这个 key 能调哪些接口。</p>
      </template>
      <template v-else>
        <p class="warn">这串 key 只显示这一次，关掉就找不回来了。</p>
        <div class="secret">
          <code>{{ secret }}</code>
        </div>
        <button class="btn" type="button" @click="copySecret">复制</button>
      </template>

      <template #footer>
        <template v-if="!secret">
          <button class="btn" type="button" @click="createOpen = false">取消</button>
          <button class="btn btn-primary" type="button" @click="create">创建</button>
        </template>
        <button v-else class="btn btn-primary" type="button" @click="createOpen = false; secret = ''">
          完成
        </button>
      </template>
    </Modal>
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
  gap: 8px;
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

.muted {
  color: var(--text-3);
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

.row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.row > label {
  flex: 0 0 56px;
  padding-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.btn-sm {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
}

.danger {
  color: #cf1322;
  border-color: #ffccc7;
}

.warn {
  color: #d46b08;
  font-size: 13px;
  margin-bottom: 10px;
}

.secret {
  padding: 10px 12px;
  margin-bottom: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fafafa;
  word-break: break-all;
  font-size: 12.5px;
}
</style>
