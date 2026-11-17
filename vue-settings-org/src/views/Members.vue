<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import Modal from '../components/Modal.vue'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

interface OrgMember {
  user: string
  role: string
}

interface Org {
  id: string
  name: string
  code: string
  members: OrgMember[]
}

interface User {
  id: string
  name: string
  role: string
}

const org = ref<Org | null>(null)
const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')

const addOpen = ref(false)
const pickUser = ref('')
const pickRole = ref('member')

const ROLES = [
  { value: 'owner', label: '所有者' },
  { value: 'admin', label: '管理员' },
  { value: 'member', label: '成员' },
]

const candidates = computed(() => {
  const inOrg = new Set((org.value?.members ?? []).map((m) => m.user))
  return users.value.filter((u) => !inOrg.has(u.name))
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [o, u] = await Promise.all([
      http.get<{ items: Org[] }>('/api/orgs'),
      http.get<{ items: User[] }>('/api/users'),
    ])
    org.value = (o.items || [])[0] ?? null
    users.value = u.items || []
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openAdd() {
  pickUser.value = candidates.value[0]?.name ?? ''
  pickRole.value = 'member'
  addOpen.value = true
}

async function add() {
  if (!org.value || !pickUser.value) {
    showToast('先选一个用户')
    return
  }
  try {
    const r = await http.post<{ org: Org }>('/api/orgs/' + org.value.id + '/members', {
      user: pickUser.value,
      role: pickRole.value,
    })
    org.value = r.org
    addOpen.value = false
    showToast('已加入')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '添加失败')
  }
}

async function setRole(m: OrgMember, role: string) {
  if (!org.value) return
  try {
    const r = await http.patch<{ org: Org }>(
      '/api/orgs/' + org.value.id + '/members/' + encodeURIComponent(m.user),
      { user: m.user, role },
    )
    org.value = r.org
    showToast('角色已更新')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '更新失败')
  }
}

async function remove(m: OrgMember) {
  if (!org.value) return
  if (!window.confirm('把 ' + m.user + ' 移出组织？')) return
  try {
    const r = await http.del<{ org: Org }>(
      '/api/orgs/' + org.value.id + '/members/' + encodeURIComponent(m.user),
    )
    org.value = r.org
    showToast('已移除')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '移除失败')
  }
}
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>成员</h1>
      <div class="actions">
        <button class="btn" type="button" :disabled="loading" @click="load">
          <RefreshCw :size="14" />
          刷新
        </button>
        <button class="btn btn-primary" type="button" :disabled="!org" @click="openAdd">
          <Plus :size="14" />
          添加成员
        </button>
      </div>
    </div>

    <p class="sub">
      <template v-if="org">组织：<b>{{ org.name }}</b>（{{ org.members?.length ?? 0 }} 人）</template>
      <template v-else>还没有组织，先去「常规」创建一个。</template>
    </p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <table v-else-if="org" class="tbl">
      <thead>
        <tr>
          <th>用户</th>
          <th style="width: 140px">账号角色</th>
          <th style="width: 160px">组织角色</th>
          <th style="width: 80px" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in org.members" :key="m.user">
          <td><b>{{ m.user }}</b></td>
          <td class="muted">{{ users.find((u) => u.name === m.user)?.role ?? '—' }}</td>
          <td>
            <select
              class="input small"
              :value="m.role"
              @change="setRole(m, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="r in ROLES" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </td>
          <td>
            <button class="btn btn-sm danger" type="button" @click="remove(m)">
              <Trash2 :size="12" />
            </button>
          </td>
        </tr>
        <tr v-if="!org.members?.length">
          <td colspan="4" class="empty">组织里还没有人</td>
        </tr>
      </tbody>
    </table>

    <Modal :open="addOpen" title="添加成员" width="460px" @close="addOpen = false">
      <div class="row">
        <label>用户</label>
        <select v-model="pickUser" class="input">
          <option v-for="u in candidates" :key="u.id" :value="u.name">
            {{ u.name }}（{{ u.role }}）
          </option>
        </select>
      </div>
      <div class="row">
        <label>角色</label>
        <select v-model="pickRole" class="input">
          <option v-for="r in ROLES" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>
      <p v-if="!candidates.length" class="hint">所有用户都已在组织里。新用户请到「用户管理」创建。</p>
      <template #footer>
        <button class="btn" type="button" @click="addOpen = false">取消</button>
        <button class="btn btn-primary" type="button" :disabled="!candidates.length" @click="add">
          添加
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
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

.small {
  height: 28px;
  font-size: 12.5px;
}

.muted {
  color: var(--text-3);
}

.empty {
  text-align: center;
  color: var(--text-4);
  padding: 36px;
}

.err {
  color: #cf1322;
  font-size: 13px;
}

.hint {
  font-size: 12.5px;
  color: var(--text-3);
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

.row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.row > label {
  flex: 0 0 48px;
  padding-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}
</style>
