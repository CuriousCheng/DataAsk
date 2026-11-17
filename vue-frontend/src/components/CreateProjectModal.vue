<script setup lang="ts">
import { ref, watch } from 'vue'
import { BarChart3, BookOpen, Brain, Check, Sparkles, Wrench, X } from 'lucide-vue-next'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  close: []
  submit: [payload: { name: string; kind: 'agent' | 'classic' }]
}>()

const step = ref<1 | 2>(1)
const kind = ref<'agent' | 'classic'>('agent')
const name = ref('')
const lang = ref('简体中文')
const timezone = ref('Etc/GMT-8')

const AGENT_FEATURES = [
  { icon: Sparkles, title: '智能体模式：自动进行多步骤探索' },
  { icon: BookOpen, title: '知识：自动从对话中积累' },
  { icon: Wrench, title: '技能：可复用的分析工作流' },
  { icon: Brain, title: '记忆：跨会话保留上下文' },
  { icon: BarChart3, title: '人工制品：生成图表、仪表盘与报告' },
]

watch(
  () => props.open,
  (open) => {
    if (!open) return
    step.value = 1
    kind.value = 'agent'
    name.value = ''
    lang.value = '简体中文'
    timezone.value = 'Etc/GMT-8'
  },
)

function submit() {
  if (!name.value.trim()) return
  emit('submit', { name: name.value, kind: kind.value })
}
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal project-modal" role="dialog" aria-modal="true" aria-label="新建项目">
      <div class="modal-head">
        <h3 class="modal-title">新建项目</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div v-if="step === 1" class="modal-body">
        <button class="type-card" type="button" :data-active="kind === 'agent'" @click="kind = 'agent'">
          <span class="type-head">
            <span class="type-title">智能体项目</span>
            <span class="badge">推荐</span>
            <span class="radio" data-checked="true">
              <Check v-if="kind === 'agent'" :size="12" />
            </span>
          </span>
          <span class="type-sub">包含哪些功能？</span>
          <span v-for="f in AGENT_FEATURES" :key="f.title" class="feature">
            <component :is="f.icon" :size="15" />
            {{ f.title }}
          </span>
        </button>

        <button
          class="type-card classic"
          type="button"
          :data-active="kind === 'classic'"
          @click="kind = 'classic'"
        >
          <span class="type-head">
            <span class="type-title">Classic 项目</span>
            <span class="radio">
              <Check v-if="kind === 'classic'" :size="12" />
            </span>
          </span>
          <span class="type-sub">包含仪表盘、电子表格与所有经典功能。</span>
        </button>
      </div>

      <div v-else class="modal-body">
        <label class="label" for="project-name">项目名称</label>
        <input id="project-name" v-model="name" class="input" placeholder="项目名称" />

        <label class="label" style="margin-top: 18px">AI 回应语言</label>
        <select v-model="lang" class="select">
          <option>简体中文</option>
          <option>繁體中文</option>
          <option>English</option>
          <option>日本語</option>
        </select>
        <p class="hint">此设置会影响 AI 回复你时使用的语言。</p>

        <label class="label" style="margin-top: 18px">时区</label>
        <select v-model="timezone" class="select">
          <option>Etc/GMT-8</option>
          <option>Asia/Shanghai (UTC+08:00)</option>
          <option>Asia/Tokyo (UTC+09:00)</option>
          <option>America/Los_Angeles (UTC-08:00)</option>
        </select>
      </div>

      <div class="modal-foot">
        <button v-if="step === 2" class="btn back" type="button" @click="step = 1">返回</button>
        <span class="spacer" />
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button
          v-if="step === 1"
          class="btn btn-primary"
          type="button"
          @click="step = 2"
        >
          下一步
        </button>
        <button
          v-else
          class="btn btn-primary"
          type="button"
          :disabled="!name.trim()"
          @click="submit"
        >
          新建
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-modal {
  width: 600px;
}

.type-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 18px;
  margin-bottom: 14px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  text-align: left;
}

.type-card[data-active='true'] {
  border-color: var(--blue);
  box-shadow: 0 0 0 1px var(--blue) inset;
}

.type-card.classic {
  padding: 16px 18px;
}

.type-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-title {
  font-size: 16px;
  font-weight: 600;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  background: var(--blue);
  color: #fff;
  font-size: 12px;
}

.radio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: auto;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: #fff;
}

.type-card[data-active='true'] .radio {
  border-color: var(--blue);
  background: var(--blue);
}

.type-sub {
  font-size: 13px;
  color: var(--text-3);
}

.feature {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-2);
}

.label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.select {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: #fff;
  font-size: 13px;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.modal-foot {
  align-items: center;
}

.back {
  border-color: var(--line-strong);
}
</style>
