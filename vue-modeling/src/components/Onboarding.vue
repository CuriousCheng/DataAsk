<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const step = ref(0)

const STEPS = [
  {
    title: '数据建模指南',
    text: '数据建模会在你原有的数据结构之上加入一层逻辑层，整理关联、语义与计算。这能帮助 AI 对齐业务逻辑、获取精确的数据，并生成有意义的洞察。',
    extra: '我们使用 人力资源 数据集来介绍这份指南。',
  },
  { title: '创建模型', text: '点击新增图示开始建立你的第一个模型。' },
  { title: '编辑模型', text: '点击更多图示以更新模型的列或删除它。' },
  { title: '编辑元数据', text: '你可以编辑模型与列的别名与说明。' },
  { title: '建模 AI 助理', text: '运用 AI 为模型与列生成语义与关联，节省时间并提升建模的准确度。' },
]

const current = computed(() => STEPS[step.value])
const last = computed(() => step.value === STEPS.length - 1)

function next() {
  if (last.value) emit('close')
  else step.value += 1
}
</script>

<template>
  <div v-if="props.open" class="overlay onboarding">
    <div class="card">
      <div class="art">
        <div v-for="(n, i) in ['customers', 'geolocation', 'orders', 'order items']" :key="n" class="art-node" :style="{ left: 40 + i * 160 + 'px' }">
          <div class="art-head">{{ n }}</div>
          <div class="art-line" v-for="j in 4" :key="j" />
        </div>
      </div>

      <div class="text">
        <h2>{{ current.title }}</h2>
        <p>{{ current.text }}</p>
        <p v-if="current.extra" class="extra">{{ current.extra }}</p>
      </div>

      <div class="foot">
        <span class="step">{{ step + 1 }} / {{ STEPS.length }}</span>
        <button class="btn next" type="button" @click="next">
          {{ last ? '知道了' : '下一步' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay.onboarding {
  background: rgba(20, 20, 20, 0.35);
}

.card {
  width: 860px;
  max-width: calc(100vw - 80px);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.art {
  position: relative;
  height: 330px;
  background: #fbfbfb radial-gradient(#dcdcdc 1px, transparent 1px);
  background-size: 16px 16px;
}

.art-node {
  position: absolute;
  top: 60px;
  width: 140px;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}

.art-head {
  height: 30px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  background: #2f54eb;
  color: #fff;
  font-size: 12px;
}

.art-line {
  height: 18px;
  margin: 6px 10px;
  border-radius: 3px;
  background: #eee;
}

.text {
  padding: 20px 26px 6px;
  background: #262626;
  color: #fff;
}

.text h2 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 12px;
}

.text p {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.86);
}

.extra {
  margin-top: 10px;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 26px 20px;
  background: #262626;
}

.step {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.next {
  height: 34px;
  padding: 0 18px;
  border-radius: 6px;
  background: #fff;
  border-color: #fff;
  color: #1a1a1a;
}
</style>
