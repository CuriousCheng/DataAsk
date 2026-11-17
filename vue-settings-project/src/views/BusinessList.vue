<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Play, Plus, RefreshCw, Square, Trash2 } from 'lucide-vue-next'
import Modal from '../components/Modal.vue'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

interface Project {
  name: string
  datasource?: string | null
  catalog?: string | null
  models?: number
  created_at?: number
  mcp?: { running?: boolean }
}

interface DataSource {
  id: string
  name: string
  type: string
}

const items = ref<Project[]>([])
const sources = ref<DataSource[]>([])
const loading = ref(false)
const error = ref('')
const busy = ref('')

const current = ref(readCurrent())

const createOpen = ref(false)
const newName = ref('')
const dsId = ref('')

function readCurrent(): string {
  try {
    return localStorage.getItem('dataask.project') || '汽车销售分析'
  } catch {
    return '汽车销售分析'
  }
}



async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get<{ items: Project[] }>('/api/projects')
    items.value = r.items || []
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  try {
    const r = await http.get<{ items: DataSource[] }>('/api/datasources')
    sources.value = r.items || []
    if (sources.value.length) dsId.value = sources.value[0].id
  } catch {
    /* 数据源读取失败不影响列表 */
  }
})

function switchTo(name: string) {
  try {
    localStorage.setItem('dataask.project', name)
  } catch {
    /* ignore */
  }
  current.value = name
  showToast('已切换业务，正在刷新')
  setTimeout(() => location.reload(), 400)
}

async function start(p: Project) {
  busy.value = 'start:' + p.name
  try {
    const r = await http.post<{ ok: boolean; output?: string }>(
      '/api/projects/' + encodeURIComponent(p.name) + '/start',
      {},
    )
    showToast(r.ok ? '已启动' : '启动失败：' + (r.output || ''))
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '启动失败')
  } finally {
    busy.value = ''
  }
}

async function stop(p: Project) {
  busy.value = 'stop:' + p.name
  try {
    await http.post('/api/projects/' + encodeURIComponent(p.name) + '/stop', {})
    showToast('已停止')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '停止失败')
  } finally {
    busy.value = ''
  }
}

async function remove(p: Project) {
  if (!window.confirm('删除业务「' + p.name + '」？会删除整个项目目录，不可恢复。')) return
  busy.value = 'del:' + p.name
  try {
    await http.del('/api/projects/' + encodeURIComponent(p.name))
    showToast('已删除')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '删除失败')
  } finally {
    busy.value = ''
  }
}

async function submitCreate() {
  const name = newName.value.trim()
  if (!name) {
    showToast('先填业务名')
    return
  }
  try {
    await http.post('/api/projects', { name, datasource_id: dsId.value })
    createOpen.value = false
    newName.value = ''
    showToast('已创建')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '创建失败')
  }
}
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>业务管理</h1>
      <div class="actions">
        <button class="btn" type="button" :disabled="loading" @click="load">
          <RefreshCw :size="14" />
          刷新
        </button>
        <button class="btn btn-primary" type="button" @click="createOpen = true">
          <Plus :size="14" />
          新建业务
        </button>
      </div>
    </div>

    <p class="sub">
      业务就是一个 Wren 项目目录。当前业务：<b>{{ current }}</b>（建模、知识、提问都跟着它）
    </p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <table v-else class="tbl">
      <thead>
        <tr>
          <th>名称</th>
          <th style="width: 140px">数据源</th>
          <th style="width: 80px">模型</th>
          <th style="width: 120px">创建时间</th>
          <th style="width: 300px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in items" :key="p.name" :class="{ on: p.name === current }">
          <td>
            <b>{{ p.name }}</b>
            <span v-if="p.name === current" class="tag">当前</span>
          </td>
          <td class="muted">{{ p.datasource || '—' }}</td>
          <td>{{ p.models ?? 0 }}</td>
          <td class="muted">{{ p.created_at ? new Date(p.created_at * 1000).toLocaleDateString('zh-CN') : '—' }}</td>
          <td class="ops">
            <button class="btn btn-sm" type="button" :disabled="!!busy" @click="start(p)">
              <Play :size="12" />
              启动
            </button>
            <button class="btn btn-sm" type="button" :disabled="!!busy" @click="stop(p)">
              <Square :size="12" />
              停止
            </button>
            <button class="btn btn-sm" type="button" :disabled="p.name === current" @click="switchTo(p.name)">
              切到此业务
            </button>
            <button class="btn btn-sm danger" type="button" :disabled="!!busy" @click="remove(p)">
              <Trash2 :size="12" />
            </button>
          </td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="5" class="empty">还没有业务，点右上角新建</td>
        </tr>
      </tbody>
    </table>

    <Modal :open="createOpen" title="新建业务" width="520px" @close="createOpen = false">
      <div class="row">
        <label>名称</label>
        <input v-model="newName" class="input" placeholder="例如 汽车销售分析" />
      </div>
      <div class="row">
        <label>数据源</label>
        <select v-model="dsId" class="input">
          <option v-for="s in sources" :key="s.id" :value="s.id">{{ s.name }}（{{ s.type }}）</option>
        </select>
      </div>
      <p class="hint">创建后到「建模」里加入表、配关系。</p>
      <template #footer>
        <button class="btn" type="button" @click="createOpen = false">取消</button>
        <button class="btn btn-primary" type="button" @click="submitCreate">创建</button>
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
  margin-bottom: 10px;
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
  margin-bottom: 16px;
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
  height: 42px;
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

.tbl tr.on td {
  background: #f7faff;
}

.muted {
  color: var(--text-3);
}

.tag {
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #eef3ff;
  color: #1d39c4;
  font-size: 11px;
}

.ops {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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
</style>
