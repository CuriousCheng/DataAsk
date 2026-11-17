<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

interface Org {
  id: string
  name: string
  members?: { user: string; role: string }[]
}

const org = ref<Org | null>(null)
const error = ref('')
const busy = ref(false)

const myRole = computed(() => {
  const me = org.value?.members?.find((m) => m.user === 'admin')
  return me?.role || ''
})

async function load() {
  try {
    const r = await http.get<{ items: Org[] }>('/api/orgs')
    org.value = (r.items || [])[0] ?? null
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  }
}

onMounted(load)

function leave() {
  showToast('后端没有“退出组织”接口，只能删除组织')
}

async function removeOrg() {
  if (!org.value) return
  if (!window.confirm('删除组织「' + org.value.name + '」？此操作不可恢复。')) return
  if (!window.confirm('再确认一次：组织记录会被永久删除。')) return
  busy.value = true
  try {
    await http.del('/api/orgs/' + org.value.id)
    showToast('组织已删除')
    org.value = null
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '删除失败')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page">
    <h1>危险区域</h1>
    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="!org" class="hint">还没有组织。</p>

    <div v-else class="danger-card">
      <div class="row">
        <div class="text">
          <div class="title">退出组织</div>
          <p class="desc">
            后端没有「退出组织」接口（成员关系只有增删改，没有自己退出）。
            当前角色：{{ myRole || '—' }}。
          </p>
        </div>
        <button class="btn" type="button" disabled @click="leave">退出组织</button>
      </div>

      <div class="divider" />

      <div class="row">
        <div class="text">
          <div class="title">删除组织</div>
          <p class="desc">
            删除组织「{{ org.name }}」的成员关系记录（不会动业务目录、用户账号）。
          </p>
        </div>
        <button class="btn danger" type="button" :disabled="busy" @click="removeOrg">
          {{ busy ? '删除中…' : '删除组织' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1400px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.danger-card {
  border: 1px solid #ffa39e;
  border-radius: 8px;
  padding: 0 20px;
  background: #fff;
}

.row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
}

.text {
  flex: 1;
}

.title {
  font-size: 14px;
  font-weight: 600;
}

.desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-2);
}

.divider {
  height: 1px;
  background: #ffd8d6;
}

.btn {
  min-width: 104px;
}

.btn.danger {
  color: #fff;
  background: #cf1322;
  border-color: #cf1322;
}

.err {
  color: #cf1322;
  font-size: 13px;
}

.hint {
  font-size: 13px;
  color: var(--text-3);
}
</style>
