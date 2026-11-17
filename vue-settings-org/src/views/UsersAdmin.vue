<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import Modal from '../components/Modal.vue'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

interface User {
  id: string
  name: string
  role: string
  created_at?: number
}

const items = ref<User[]>([])
const loading = ref(false)
const error = ref('')

const createOpen = ref(false)
const newName = ref('')
const newPass = ref('')
const newRole = ref('viewer')

const pwdOpen = ref(false)
const pwdUser = ref('')
const pwdValue = ref('')

const ROLES = [
  { value: 'admin', label: 'admin（数据源、账号、全部）' },
  { value: 'editor', label: 'editor（建模、提问）' },
  { value: 'viewer', label: 'viewer（只读提问）' },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get<{ items: User[] }>('/api/users')
    items.value = r.items || []
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function create() {
  if (!newName.value.trim() || !newPass.value) {
    showToast('用户名和密码都要填')
    return
  }
  try {
    await http.post('/api/users', {
      name: newName.value.trim(),
      password: newPass.value,
      role: newRole.value,
    })
    createOpen.value = false
    newName.value = ''
    newPass.value = ''
    showToast('用户已创建')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '创建失败')
  }
}

function openPwd(u: User) {
  pwdUser.value = u.name
  pwdValue.value = ''
  pwdOpen.value = true
}

async function savePwd() {
  if (!pwdValue.value) {
    showToast('先填新密码')
    return
  }
  try {
    await http.put('/api/users/' + encodeURIComponent(pwdUser.value) + '/password', {
      password: pwdValue.value,
    })
    pwdOpen.value = false
    showToast('密码已重置')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '重置失败')
  }
}

async function setRole(u: User, role: string) {
  try {
    await http.put('/api/users/' + encodeURIComponent(u.name) + '/role', { role })
    showToast('角色已更新')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '更新失败')
  }
}

async function remove(u: User) {
  if (!window.confirm('删除用户 ' + u.name + ' ？')) return
  try {
    await http.del('/api/users/' + encodeURIComponent(u.name))
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
      <h1>用户</h1>
      <div class="actions">
        <button class="btn" type="button" :disabled="loading" @click="load">
          <RefreshCw :size="14" />
          刷新
        </button>
        <button class="btn btn-primary" type="button" @click="createOpen = true">
          <Plus :size="14" />
          新建用户
        </button>
      </div>
    </div>
    <p class="sub">账号是全局的；组织成员关系在「成员」页维护。</p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <table v-else class="tbl">
      <thead>
        <tr>
          <th>用户名</th>
          <th style="width: 180px">角色</th>
          <th style="width: 170px">创建时间</th>
          <th style="width: 180px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in items" :key="u.id">
          <td><b>{{ u.name }}</b></td>
          <td>
            <select class="input small" :value="u.role" @change="setRole(u, ($event.target as HTMLSelectElement).value)">
              <option v-for="r in ROLES" :key="r.value" :value="r.value">{{ r.value }}</option>
            </select>
          </td>
          <td class="muted">
            {{ u.created_at ? new Date(u.created_at * 1000).toLocaleDateString('zh-CN') : '—' }}
          </td>
          <td class="ops">
            <button class="btn btn-sm" type="button" @click="openPwd(u)">
              <KeyRound :size="12" />
              重置密码
            </button>
            <button class="btn btn-sm danger" type="button" @click="remove(u)">
              <Trash2 :size="12" />
            </button>
          </td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="4" class="empty">还没有用户</td>
        </tr>
      </tbody>
    </table>

    <Modal :open="createOpen" title="新建用户" width="480px" @close="createOpen = false">
      <div class="row">
        <label>用户名</label>
        <input v-model="newName" class="input" placeholder="例如 zhangsan" />
      </div>
      <div class="row">
        <label>密码</label>
        <input v-model="newPass" class="input" type="password" />
      </div>
      <div class="row">
        <label>角色</label>
        <select v-model="newRole" class="input">
          <option v-for="r in ROLES" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>
      <template #footer>
        <button class="btn" type="button" @click="createOpen = false">取消</button>
        <button class="btn btn-primary" type="button" @click="create">创建</button>
      </template>
    </Modal>

    <Modal :open="pwdOpen" title="重置密码" width="440px" @close="pwdOpen = false">
      <div class="row">
        <label>用户</label>
        <div class="ctrl muted">{{ pwdUser }}</div>
      </div>
      <div class="row">
        <label>新密码</label>
        <input v-model="pwdValue" class="input" type="password" />
      </div>
      <template #footer>
        <button class="btn" type="button" @click="pwdOpen = false">取消</button>
        <button class="btn btn-primary" type="button" @click="savePwd">保存</button>
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

.ops {
  display: flex;
  gap: 6px;
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
  flex: 0 0 60px;
  padding-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.ctrl {
  flex: 1;
}
</style>
