<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CheckCircle2, XCircle } from 'lucide-vue-next'
import { ApiError, http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

const protocol = ref<'openai' | 'anthropic'>('openai')
const baseUrl = ref('')
const model = ref('')
const apiKey = ref('')
const hasKey = ref(false)
const loading = ref(false)
const testing = ref(false)
const testMsg = ref('')
const testOk = ref(false)
const models = ref<string[]>([])

async function load() {
  loading.value = true
  try {
    const res = await http.get<{
      protocol?: string
      base_url?: string
      model?: string
      has_key?: boolean
    }>('/api/ai')
    protocol.value = (res.protocol as 'openai' | 'anthropic') || 'openai'
    baseUrl.value = res.base_url || ''
    model.value = res.model || ''
    hasKey.value = !!res.has_key
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '读取失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function test() {
  testing.value = true
  testMsg.value = ''
  try {
    const res = await http.post<{
      ok: boolean
      error?: string
      models?: string[]
      endpoint?: string
    }>('/api/ai/test', {
      protocol: protocol.value,
      base_url: baseUrl.value,
      api_key: apiKey.value,
    })
    testOk.value = !!res.ok
    models.value = res.models || []
    testMsg.value = res.ok
      ? '连通' + (res.endpoint ? '：' + res.endpoint : '') + '，返回 ' + models.value.length + ' 个模型'
      : '失败：' + (res.error || '未知错误')
  } catch (e) {
    testOk.value = false
    testMsg.value = e instanceof ApiError ? e.message : '测试失败'
  } finally {
    testing.value = false
  }
}

function pickModel(m: string) {
  model.value = m
  showToast('已选模型 ' + m + '，记得点保存')
}

async function save() {
  try {
    await http.put('/api/ai', {
      protocol: protocol.value,
      base_url: baseUrl.value,
      model: model.value,
      api_key: apiKey.value,
    })
    apiKey.value = ''
    showToast('已保存')
    await load()
  } catch (e) {
    showToast(e instanceof ApiError ? e.message : '保存失败')
  }
}
</script>

<template>
  <div class="page">
    <h1>AI 设置</h1>
    <p class="sub">问答用的模型接口。保存后所有项目的提问都会走这里配置的接口。</p>

    <div class="card">
      <div class="row">
        <label>协议</label>
        <div class="ctrl">
          <select v-model="protocol" class="input">
            <option value="openai">OpenAI 兼容（/v1/chat/completions）</option>
            <option value="anthropic">Anthropic（/v1/messages）</option>
          </select>
        </div>
      </div>

      <div class="row">
        <label>Base URL</label>
        <div class="ctrl">
          <input v-model="baseUrl" class="input" placeholder="例如 https://api.deepseek.com/v1" />
        </div>
      </div>

      <div class="row">
        <label>模型</label>
        <div class="ctrl">
          <input v-model="model" class="input" placeholder="例如 deepseek-chat" />
        </div>
      </div>

      <div class="row">
        <label>API Key</label>
        <div class="ctrl">
          <input
            v-model="apiKey"
            class="input"
            type="password"
            :placeholder="hasKey ? '已保存，留空表示不修改' : '粘贴 key'"
          />
        </div>
      </div>

      <div v-if="models.length" class="models">
        <span class="mlabel">返回的模型（点一下填入）</span>
        <div class="chips">
          <button
            v-for="m in models"
            :key="m"
            class="chip"
            type="button"
            :data-on="model === m"
            @click="pickModel(m)"
          >
            {{ m }}
          </button>
        </div>
      </div>
      <p v-if="testMsg" class="test" :class="testOk ? 'ok' : 'bad'">
        <component :is="testOk ? CheckCircle2 : XCircle" :size="14" />
        {{ testMsg }}
      </p>

      <div class="actions">
        <button class="btn" type="button" :disabled="testing" @click="test">
          {{ testing ? '测试中…' : '测试连接' }}
        </button>
        <button class="btn btn-primary" type="button" :disabled="loading" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
}

.sub {
  font-size: 13px;
  color: var(--text-3);
  margin-bottom: 18px;
}

.card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px 20px;
  background: #fff;
}

.row {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.row > label {
  flex: 0 0 76px;
  padding-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.ctrl {
  flex: 1;
}

.models {
  margin: 4px 0 12px;
}

.mlabel {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  color: var(--text-2);
}

.chip[data-on='true'] {
  border-color: #3157c4;
  background: #eef3ff;
  color: #1d39c4;
}

.test {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 12px;
  font-size: 12.5px;
}

.test.ok {
  color: #389e0d;
}

.test.bad {
  color: #cf1322;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--line);
}
</style>
