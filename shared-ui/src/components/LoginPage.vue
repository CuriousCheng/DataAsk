<script setup lang="ts">
import { ref } from 'vue'
import BrandMark from './BrandMark.vue'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api'

const { login, loading } = useAuth()
const name = ref('admin')
const password = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  if (!name.value.trim() || !password.value) {
    error.value = '用户名和密码都要填'
    return
  }
  try {
    await login(name.value.trim(), password.value)
    window.location.reload()
  } catch (e) {
    if (e instanceof ApiError) error.value = e.message
    else error.value = '登录失败，请稍后再试'
  }
}
</script>

<template>
  <div class="login">
    <form class="card" @submit.prevent="submit">
      <div class="brand">
        <BrandMark :size="34" color="#1a1a1a" />
        <span>DataAsk</span>
      </div>
      <p class="sub">登录 Wren Console 后端</p>

      <label class="label">用户名</label>
      <input v-model="name" class="input" autocomplete="username" />

      <label class="label">密码</label>
      <input v-model="password" class="input" type="password" autocomplete="current-password" />

      <p v-if="error" class="err">{{ error }}</p>

      <button class="btn btn-primary submit" type="submit" :disabled="loading">
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.card {
  width: 360px;
  padding: 28px 28px 24px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
}

.sub {
  margin: 8px 0 20px;
  font-size: 12px;
  color: var(--text-3);
}

.label {
  display: block;
  margin: 12px 0 6px;
  font-size: 12px;
  color: var(--text-2);
}

.err {
  margin-top: 10px;
  font-size: 12px;
  color: #cf1322;
}

.submit {
  width: 100%;
  height: 38px;
  margin-top: 20px;
}
</style>
