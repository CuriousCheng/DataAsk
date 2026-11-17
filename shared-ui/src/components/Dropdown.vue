<script setup lang="ts">
import { ref } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'

export interface Option {
  value: string
  label: string
  desc?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: Option[]
    placeholder?: string
    width?: string
    searchable?: boolean
    drop?: 'up' | 'down'
  }>(),
  { placeholder: '请选择', width: '100%', searchable: false, drop: 'down' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const query = ref('')

function pick(v: string) {
  emit('update:modelValue', v)
  open.value = false
  query.value = ''
}

function filtered() {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
}
</script>

<template>
  <div class="dd" :style="{ width }">
    <button class="dd-trigger" type="button" :data-open="open" @click="open = !open">
      <span class="dd-value">{{ options.find((o) => o.value === modelValue)?.label ?? placeholder }}</span>
      <span class="dd-right">
        <span v-if="searchable && open" class="dd-search-icon">⌕</span>
        <ChevronDown :size="16" />
      </span>
    </button>

    <div v-if="open" class="pop dd-pop" :class="drop === 'up' ? 'up' : 'down'">
      <div v-if="searchable" class="dd-search">
        <input v-model="query" placeholder="搜索" />
      </div>
      <button
        v-for="o in filtered()"
        :key="o.value"
        class="pop-item dd-item"
        type="button"
        :data-active="o.value === modelValue"
        @click="pick(o.value)"
      >
        <span class="dd-item-main">
          <span class="dd-item-label">{{ o.label }}</span>
          <span v-if="o.desc" class="dd-item-desc">{{ o.desc }}</span>
        </span>
        <Check v-if="o.value === modelValue" :size="14" class="dd-check" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.dd {
  position: relative;
}

.dd-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: #fff;
  font-size: 13px;
  text-align: left;
}

.dd-trigger:hover,
.dd-trigger[data-open='true'] {
  border-color: #9aa7ff;
}

.dd-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dd-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-3);
}

.dd-pop {
  left: 0;
  right: 0;
  max-height: 320px;
  overflow-y: auto;
  z-index: 30;
}

.dd-pop.down {
  top: 38px;
}

.dd-pop.up {
  bottom: 38px;
}

.dd-search {
  padding: 6px 6px 8px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 4px;
}

.dd-search input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 4px;
  outline: none;
  font-size: 13px;
}

.dd-item {
  height: auto;
  min-height: 34px;
  padding: 6px 10px;
}

.dd-item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dd-item-label {
  font-size: 13px;
}

.dd-item-desc {
  font-size: 12px;
  color: var(--text-3);
}

.dd-check {
  margin-left: auto;
  color: var(--blue);
}
</style>
