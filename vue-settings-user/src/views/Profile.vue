<script setup lang="ts">
import { computed, ref } from 'vue'
import { ApiError, http, useAuth } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

const { user } = useAuth()

const name = computed(() => user.value?.name || 'admin')
const role = computed(() => user.value?.role || 'viewer')

const oldPass = ref('')
const newPass = ref('')
const newPass2 = ref('')
const changing = ref(false)

async function changePassword() {
  if (!newPass.value) {
    showToast('新密码不能为空')
    return
  }
  if (newPass.value !== newPass2.value) {
    showToast('两次输入的新密码不一致')
    return
  }
  changing.value = true
  try {
    await http.put('/api/me/password', {
      old_password: oldPass.value,
      new_password: newPass.value,
    })
    oldPass.value = ''
    newPass.value = ''
    newPass2.value = ''
    showToast('密码已修改')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '修改失败')
  } finally {
    changing.value = false
  }
}
</script>

<template>
  <div class="page">
    <h1>个人资料</h1>

    <h2>账号</h2>
    <section class="card">
      <div class="row">
        <label>用户名:</label>
        <div class="ctrl muted">{{ name }}</div>
      </div>
      <div class="row">
        <label>角色:</label>
        <div class="ctrl muted">{{ role }}</div>
      </div>
      <div class="row">
        <label>邮箱:</label>
        <div class="ctrl">
          <input class="input" value="" placeholder="后端没有邮箱字段" disabled />
        </div>
      </div>
    </section>

    <h2 style="margin-top: 26px">修改密码</h2>
    <section class="card">
      <div class="row">
        <label>原密码:</label>
        <div class="ctrl"><input v-model="oldPass" class="input" type="password" /></div>
      </div>
      <div class="row">
        <label>新密码:</label>
        <div class="ctrl"><input v-model="newPass" class="input" type="password" /></div>
      </div>
      <div class="row">
        <label>确认:</label>
        <div class="ctrl"><input v-model="newPass2" class="input" type="password" /></div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" type="button" :disabled="changing" @click="changePassword">
          {{ changing ? '提交中…' : '修改密码' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 1200px;
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
  padding: 24px 26px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.row > label {
  flex: 0 0 96px;
  padding-top: 8px;
  text-align: right;
  font-size: 13px;
}

.ctrl {
  flex: 1;
  max-width: 640px;
}

.muted {
  padding-top: 8px;
  color: var(--text-2);
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 10px;
  padding-left: 112px;
}
</style>
