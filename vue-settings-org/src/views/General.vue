<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Copy } from 'lucide-vue-next'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

interface Org {
  id: string
  name: string
  code: string
  created_at?: number
  created_by?: string
  members?: { user: string; role: string }[]
}

const org = ref<Org | null>(null)
const draft = ref('')
const saved = ref('')
const loading = ref(false)
const error = ref('')

const dirty = computed(() => draft.value.trim() !== saved.value)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get<{ items: Org[] }>('/api/orgs')
    org.value = (r.items || [])[0] ?? null
    draft.value = org.value?.name ?? ''
    saved.value = org.value?.name ?? ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function createOrg() {
  try {
    const r = await http.post<{ org: Org }>('/api/orgs', { name: draft.value.trim() || '我的组织' })
    org.value = r.org
    draft.value = r.org.name
    saved.value = r.org.name
    showToast('组织已创建')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '创建失败')
  }
}

async function save() {
  if (!org.value) return
  try {
    const r = await http.patch<{ org: Org }>('/api/orgs/' + org.value.id, {
      name: draft.value.trim(),
    })
    org.value = { ...org.value, ...r.org }
    draft.value = r.org.name
    saved.value = r.org.name
    showToast('已保存')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '保存失败')
  }
}

function discard() {
  draft.value = saved.value
}

function copyId() {
  const id = org.value?.code || org.value?.id || ''
  navigator.clipboard?.writeText(id).then(
    () => showToast('已复制组织标识：' + id),
    () => showToast('组织标识：' + id),
  )
}
</script>

<template>
  <div class="page">
    <h1>常规</h1>
    <p v-if="loading" class="hint">加载中…</p>
    <p v-else-if="error" class="err">{{ error }}</p>

    <template v-else-if="org">
      <h2>组织名称</h2>
      <section class="card">
        <div class="row">
          <label>组织标识:</label>
          <div class="ctrl id-ctrl">
            <input class="input" :value="org.code" readonly />
            <button class="icon-btn" type="button" aria-label="复制组织标识" @click="copyId">
              <Copy :size="15" />
            </button>
          </div>
        </div>

        <div class="row">
          <label>组织名称:</label>
          <div class="ctrl">
            <input v-model="draft" class="input" />
          </div>
        </div>

        <div class="row">
          <label>成员数:</label>
          <div class="ctrl muted">{{ org.members?.length ?? 0 }}</div>
        </div>

        <div class="actions">
          <button class="btn" type="button" :disabled="!dirty" @click="discard">放弃更改</button>
          <button class="btn btn-primary" type="button" :disabled="!dirty" @click="save">保存</button>
        </div>
      </section>
    </template>

    <template v-else>
      <h2>还没有组织</h2>
      <section class="card">
        <div class="row">
          <label>组织名称:</label>
          <div class="ctrl">
            <input v-model="draft" class="input" placeholder="例如 示例科技有限公司" />
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-primary" type="button" @click="createOrg">创建组织</button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 1180px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 18px;
}

h2 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}

.card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 26px 28px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
}

.row > label {
  flex: 0 0 96px;
  padding-top: 8px;
  text-align: right;
  font-size: 13px;
}

.ctrl {
  flex: 1;
  max-width: 870px;
}

.id-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}

.actions {
  display: flex;
  gap: 10px;
  padding-left: 112px;
}

.muted {
  padding-top: 8px;
  color: var(--text-3);
  font-size: 13px;
}

.hint {
  font-size: 13px;
  color: var(--text-3);
}

.err {
  color: #cf1322;
  font-size: 13px;
}
</style>
