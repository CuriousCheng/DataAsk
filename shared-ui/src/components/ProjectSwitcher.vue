<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ChevronDown, Plus, Check } from 'lucide-vue-next'
import { http, ApiError } from '../lib/api'

interface Project {
  name: string
  datasource?: string
  models?: number
}

interface DataSource {
  id: string
  name: string
  type: string
}

const open = ref(false)
const projects = ref<Project[]>([])
const current = ref(readCurrent())
const loading = ref(false)

const createOpen = ref(false)
const newName = ref('')
const sources = ref<DataSource[]>([])
const dsId = ref('')
const busy = ref(false)
const err = ref('')

function readCurrent(): string {
  try {
    return localStorage.getItem('dataask.project') || '汽车销售分析'
  } catch {
    return '汽车销售分析'
  }
}

function setCurrent(name: string) {
  try {
    localStorage.setItem('dataask.project', name)
  } catch {
    /* ignore */
  }
  current.value = name
}

async function loadProjects() {
  loading.value = true
  try {
    const r = await http.get<{ items: Project[] }>('/api/projects')
    projects.value = r.items || []
    if (projects.value.length && !projects.value.some((p) => p.name === current.value)) {
      setCurrent(projects.value[0].name)
    }
  } catch {
    projects.value = []
  } finally {
    loading.value = false
  }
}

async function toggle() {
  open.value = !open.value
  if (open.value && !projects.value.length) await loadProjects()
}

async function pick(name: string) {
  open.value = false
  if (name === current.value) return
  setCurrent(name)
  location.reload()
}

async function openCreate() {
  open.value = false
  createOpen.value = true
  err.value = ''
  newName.value = ''
  if (!sources.value.length) {
    try {
      const r = await http.get<{ items: DataSource[] }>('/api/datasources')
      sources.value = r.items || []
      if (sources.value.length) dsId.value = sources.value[0].id
    } catch (e) {
      err.value = e instanceof ApiError ? e.message : '读取数据源失败'
    }
  }
}

async function submitCreate() {
  const name = newName.value.trim()
  if (!name) {
    err.value = '先填业务名'
    return
  }
  busy.value = true
  err.value = ''
  try {
    await http.post('/api/projects', { name, datasource_id: dsId.value })
    setCurrent(name)
    createOpen.value = false
    location.reload()
  } catch (e) {
    err.value = e instanceof ApiError ? e.message : '创建失败'
  } finally {
    busy.value = false
  }
}

onMounted(loadProjects)
</script>

<template>
  <div class="switcher">
    <button class="scope-btn" type="button" @click="toggle">
      {{ current }}
      <ChevronDown :size="14" />
    </button>

    <div v-if="open" class="menu" @mouseleave="open = false">
      <p v-if="loading" class="hint">加载中…</p>
      <template v-else>
        <button
          v-for="p in projects"
          :key="p.name"
          class="item"
          type="button"
          @click="pick(p.name)"
        >
          <Check :size="13" :style="{ visibility: p.name === current ? 'visible' : 'hidden' }" />
          <span class="name">{{ p.name }}</span>
          <span class="meta">{{ p.models ?? 0 }} 模型</span>
        </button>
        <p v-if="!projects.length" class="hint">还没有业务</p>
        <div class="divider" />
        <button class="item create" type="button" @click="openCreate">
          <Plus :size="13" />
          新建业务
        </button>
      </template>
    </div>

    <div v-if="createOpen" class="overlay" @mousedown.self="createOpen = false">
      <div class="dialog" role="dialog" aria-modal="true">
        <h3>新建业务</h3>
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
        <p class="hint">业务就是 Wren 项目目录；创建后可以加入表、配关系、写指标。</p>
        <p v-if="err" class="err">{{ err }}</p>
        <div class="acts">
          <button class="btn" type="button" @click="createOpen = false">取消</button>
          <button class="btn primary" type="button" :disabled="busy" @click="submitCreate">
            {{ busy ? '创建中…' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.switcher {
  position: relative;
}

.scope-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 8px;
  border-radius: 6px;
  color: #fff;
  font-size: 12.5px;
  background: transparent;
  cursor: pointer;
}

.scope-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.menu {
  position: absolute;
  top: 34px;
  left: 0;
  z-index: 60;
  min-width: 240px;
  padding: 6px;
  border-radius: 8px;
  background: #fff;
  color: var(--text);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  border: 1px solid var(--line);
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.item:hover {
  background: #f5f7fa;
}

.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 11.5px;
  color: var(--text-4);
}

.divider {
  height: 1px;
  margin: 6px 4px;
  background: var(--line);
}

.create {
  color: #1d39c4;
}

.hint {
  padding: 6px 8px;
  font-size: 12px;
  color: var(--text-3);
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.dialog {
  width: 520px;
  padding: 20px 22px;
  border-radius: 10px;
  background: #fff;
  color: var(--text);
}

.dialog h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.row > label {
  flex: 0 0 60px;
  padding-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.err {
  color: #cf1322;
  font-size: 12.5px;
  margin-bottom: 8px;
}

.acts {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
