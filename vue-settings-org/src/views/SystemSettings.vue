<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const form = ref({
  pool_size: 3,
  ask_concurrency: 2,
  viewer_can_see_sql: false,
  idle_stop_minutes: 30,
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await http.get<typeof form.value>('/api/config')
    form.value = { ...form.value, ...r }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function save() {
  saving.value = true
  try {
    await http.put('/api/config', form.value)
    showToast('已保存')
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="page">
    <h1>系统设置</h1>
    <p class="sub">影响所有业务的运行参数，来自后端 <code>GET/PUT /api/config</code>。</p>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>

    <section v-else class="card">
      <div class="row">
        <label>项目池大小</label>
        <div class="ctrl">
          <input v-model.number="form.pool_size" class="input" type="number" min="1" max="20" />
          <p class="hint">同时保持多少个项目的 MCP 进程。</p>
        </div>
      </div>

      <div class="row">
        <label>提问并发</label>
        <div class="ctrl">
          <input v-model.number="form.ask_concurrency" class="input" type="number" min="1" max="10" />
          <p class="hint">同时处理多少个提问；太大容易撞到模型限流。</p>
        </div>
      </div>

      <div class="row">
        <label>空闲回收</label>
        <div class="ctrl">
          <input v-model.number="form.idle_stop_minutes" class="input" type="number" min="1" max="1440" />
          <p class="hint">项目多久没人用就停掉它的 MCP 进程（分钟）。</p>
        </div>
      </div>

      <div class="row">
        <label>viewer 看 SQL</label>
        <div class="ctrl check">
          <input v-model="form.viewer_can_see_sql" type="checkbox" id="vcs" />
          <label for="vcs">允许 viewer 角色看到生成的 SQL</label>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" type="button" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

.sub {
  margin: 6px 0 18px;
  font-size: 13px;
  color: var(--text-3);
}

.card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 24px 26px;
  background: #fff;
}

.row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.row > label {
  flex: 0 0 110px;
  padding-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.ctrl {
  flex: 1;
  max-width: 420px;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  font-size: 13px;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-4);
}

.actions {
  padding-left: 126px;
}

.err {
  color: #cf1322;
  font-size: 13px;
}
</style>
