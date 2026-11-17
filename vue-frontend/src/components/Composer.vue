<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowUp, Check, ChevronDown, Plus, RefreshCw } from 'lucide-vue-next'
import { ai, ensureAi, probeModels, providerLabel, setModel } from '../lib/modelSettings'

const props = withDefaults(defineProps<{ placeholder?: string }>(), {
  placeholder: '提问以探索你的数据',
})
const emit = defineEmits<{ submit: [question: string] }>()

const text = ref('')
const menuOpen = ref(false)

const ready = computed(() => text.value.trim().length > 0)
const modelLabel = computed(() => ai.model || '未配置模型')

onMounted(async () => {
  await ensureAi()
})

async function openMenu() {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value && !ai.models.length && !ai.probing) await probeModels()
}

async function pick(m: string) {
  await setModel(m)
  menuOpen.value = false
}

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('submit', value)
  text.value = ''
}
</script>

<template>
  <div class="composer">
    <textarea
      v-model="text"
      class="composer-input"
      rows="1"
      :placeholder="props.placeholder"
      @keydown.enter.exact.prevent="submit"
    />

    <div class="bar">
      <button class="icon-btn" type="button" aria-label="添加附件">
        <Plus :size="18" />
      </button>

      <div class="bar-right">
        <div class="anchor">
          <button class="pill" type="button" :data-open="menuOpen" @click="openMenu">
            {{ modelLabel }}
            <span class="dot">·</span>
            {{ providerLabel() }}
            <ChevronDown :size="13" />
          </button>

          <div v-if="menuOpen" class="pop model-pop" @mouseleave="menuOpen = false">
            <div class="pop-label">
              接口：{{ ai.protocol }}｜{{ ai.base_url || '未配置' }}
            </div>

            <button class="pop-item" type="button" :disabled="ai.probing" @click="probeModels">
              <RefreshCw :size="13" :class="{ spin: ai.probing }" />
              {{ ai.probing ? '探测中…' : '刷新模型列表' }}
            </button>

            <div class="pop-sep" />

            <p v-if="!ai.models.length && !ai.probing" class="hint">
              还没有模型列表，点上面「刷新模型列表」；或在 组织设置 → AI 设置 里配接口。
            </p>

            <button
              v-for="m in ai.models"
              :key="m"
              class="pop-item"
              type="button"
              :data-active="ai.model === m"
              :disabled="ai.saving"
              @click="pick(m)"
            >
              {{ m }}
              <Check v-if="ai.model === m" :size="14" class="check" />
            </button>

            <p v-if="ai.error" class="err">{{ ai.error }}</p>
          </div>
        </div>

        <button class="send" type="button" :data-ready="ready" aria-label="发送" @click="submit">
          <ArrowUp :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.composer {
  position: relative;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xl);
  background: #fff;
  padding: 12px 12px 8px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
}

.composer-input {
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  padding: 2px 4px;
  background: transparent;
}

.composer-input::placeholder {
  color: var(--text-4);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.bar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.anchor {
  position: relative;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 8px;
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 13px;
}

.pill:hover,
.pill[data-open='true'] {
  background: var(--hover);
  color: var(--text);
}

.dot {
  color: var(--text-4);
}

.model-pop {
  right: 0;
  bottom: 40px;
  min-width: 300px;
  max-height: 320px;
  overflow: auto;
}

.pop-label {
  padding: 6px 10px;
  font-size: 11.5px;
  color: var(--text-4);
  word-break: break-all;
}

.check {
  margin-left: auto;
  color: var(--blue);
}

.hint {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.6;
}

.err {
  padding: 6px 10px;
  font-size: 12px;
  color: #cf1322;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: var(--soft);
  color: var(--text-4);
  transition: background 0.15s, color 0.15s;
}

.send[data-ready='true'] {
  background: #1a1a1a;
  color: #fff;
}
</style>
