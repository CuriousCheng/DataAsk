<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Database, Info, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import Modal from '../components/Modal.vue'
import Dropdown from '../components/Dropdown.vue'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

interface DataSource {
  id: string
  name: string
  type: string
  host: string
  port: number
  database?: string
  user: string
  catalog?: string
  password_mask?: string
  last_test?: { at: number; ok: boolean } | null
}

const items = ref<DataSource[]>([])
const loading = ref(false)
const error = ref('')

const open = ref(false)
const testing = ref(false)
const testResult = ref('')
const form = ref({
  name: '',
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  database: '',
  user: 'wren',
  password: '',
})

const TYPE_OPTIONS = [
  { value: 'mysql', label: 'MySQL / MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlserver', label: 'SQL Server' },
]

const typeHint = computed(() =>
  form.value.type === 'mysql'
    ? 'MySQL 一个数据源覆盖整台服务器的所有库。'
    : 'PostgreSQL / SQL Server 一个数据源只能连一个库，多个库要建多个数据源。',
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get<{ items: DataSource[] }>('/api/datasources')
    items.value = res.items || []
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  form.value = {
    name: '',
    type: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: '',
    user: 'wren',
    password: '',
  }
  testResult.value = ''
  open.value = true
}

function onTypeChange(t: string) {
  form.value.type = t
  form.value.port = t === 'mysql' ? 3306 : t === 'postgresql' ? 5432 : 1433
}

async function testConn() {
  testing.value = true
  testResult.value = ''
  try {
    const res = await http.post<{ ok: boolean; error?: string; version?: string }>(
      '/api/datasources/test',
      { ...form.value },
    )
    testResult.value = res.ok
      ? `连接成功${res.version ? '：' + res.version : ''}`
      : `失败：${res.error || '未知错误'}`
  } catch (e) {
    testResult.value = e instanceof ApiError ? e.message : '测试失败'
  } finally {
    testing.value = false
  }
}

async function save() {
  if (!form.value.name.trim()) {
    showToast('先填名字')
    return
  }
  try {
    await http.post('/api/datasources', { ...form.value })
    open.value = false
    showToast('已保存，已注册成 Trino catalog')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '保存失败')
  }
}

async function remove(ds: DataSource) {
  if (!window.confirm(`删除数据源「${ds.name}」？对应的 Trino catalog 也会移除。`)) return
  try {
    await http.del(`/api/datasources/${ds.id}`)
    showToast('已删除')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '删除失败')
  }
}
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>数据连接</h1>
      <div class="actions">
        <button class="btn" type="button" :disabled="loading" @click="load">
          <RefreshCw :size="14" />
          刷新
        </button>
        <button class="btn btn-primary" type="button" @click="openCreate">
          <Plus :size="14" />
          新建数据源
        </button>
      </div>
    </div>

    <div class="banner">
      <Info :size="15" />
      保存后会自动注册成 Trino 的 catalog；建模时就能在表列表里看到这些库的表。
    </div>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <div v-else-if="!items.length" class="empty">还没有数据源，点右上角「新建数据源」。</div>

    <div v-else class="grid">
      <div v-for="ds in items" :key="ds.id" class="card">
        <div class="card-head">
          <Database :size="16" />
          <span class="name">{{ ds.name }}</span>
          <button class="icon-btn" type="button" aria-label="删除" @click="remove(ds)">
            <Trash2 :size="15" />
          </button>
        </div>
        <div class="kv"><span class="k">类型</span><span>{{ ds.type }}</span></div>
        <div class="kv"><span class="k">地址</span><span>{{ ds.host }}:{{ ds.port }}</span></div>
        <div v-if="ds.database" class="kv"><span class="k">库</span><span>{{ ds.database }}</span></div>
        <div class="kv"><span class="k">账号</span><span>{{ ds.user }}</span></div>
        <div v-if="ds.catalog" class="kv"><span class="k">catalog</span><span>{{ ds.catalog }}</span></div>
        <div class="kv">
          <span class="k">上次测试</span>
          <span :class="ds.last_test?.ok ? 'ok' : 'muted'">
            {{ ds.last_test ? (ds.last_test.ok ? '成功' : '失败') : '未测试' }}
          </span>
        </div>
      </div>
    </div>

    <Modal :open="open" title="新建数据源" width="620px" @close="open = false">
      <div class="form-row">
        <label><span class="req">*</span>名称</label>
        <div class="ctrl"><input v-model="form.name" class="input" placeholder="例如 mysql_local" /></div>
      </div>
      <div class="form-row">
        <label><span class="req">*</span>类型</label>
        <div class="ctrl">
          <Dropdown :model-value="form.type" :options="TYPE_OPTIONS" @update:model-value="onTypeChange" />
          <p class="hint">{{ typeHint }}</p>
        </div>
      </div>
      <div class="form-row">
        <label><span class="req">*</span>主机</label>
        <div class="ctrl two">
          <input v-model="form.host" class="input" placeholder="127.0.0.1" />
          <input v-model.number="form.port" class="input" type="number" placeholder="端口" />
        </div>
      </div>
      <div class="form-row">
        <label>库名</label>
        <div class="ctrl">
          <input v-model="form.database" class="input" placeholder="PostgreSQL 必填；MySQL 可留空" />
        </div>
      </div>
      <div class="form-row">
        <label><span class="req">*</span>账号</label>
        <div class="ctrl two">
          <input v-model="form.user" class="input" placeholder="用户" />
          <input v-model="form.password" class="input" type="password" placeholder="密码" />
        </div>
      </div>

      <p v-if="testResult" class="test-result">{{ testResult }}</p>

      <template #footer>
        <button class="btn" type="button" :disabled="testing" @click="testConn">
          {{ testing ? '测试中…' : '测试连接' }}
        </button>
        <span style="flex: 1" />
        <button class="btn" type="button" @click="open = false">取消</button>
        <button class="btn btn-primary" type="button" @click="save">保存</button>
      </template>
    </Modal>
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
  margin-bottom: 14px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
  border: 1px solid #d6e4ff;
  border-radius: 6px;
  background: #f0f6ff;
  color: #1d39c4;
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 14px;
  background: #fff;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
}

.kv {
  display: flex;
  gap: 12px;
  padding: 3px 0;
  font-size: 12.5px;
}

.kv .k {
  flex: 0 0 64px;
  color: var(--text-3);
}

.ok {
  color: #389e0d;
}

.muted {
  color: var(--text-4);
}

.hint {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 6px;
}

.err {
  color: #cf1322;
  font-size: 13px;
}

.empty {
  padding: 60px 0;
  text-align: center;
  color: var(--text-4);
  font-size: 13px;
}

.form-row {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.form-row > label {
  flex: 0 0 56px;
  padding-top: 8px;
  font-size: 13px;
}

.ctrl {
  flex: 1;
}

.ctrl.two {
  display: flex;
  gap: 8px;
}

.req {
  color: var(--danger);
  margin-right: 2px;
}

.test-result {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--text-2);
}
</style>
