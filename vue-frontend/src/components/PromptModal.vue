<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    label?: string
    placeholder?: string
    value?: string
    confirmText?: string
  }>(),
  { label: '文件夹名称', placeholder: '文件夹名称', value: '', confirmText: '提交' },
)

const emit = defineEmits<{ close: []; submit: [value: string] }>()

const text = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    text.value = props.value
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  },
)

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('submit', value)
}
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="title">
      <div class="modal-head">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <label class="field-label" for="prompt-input">{{ label }}</label>
        <input
          id="prompt-input"
          ref="inputRef"
          v-model="text"
          class="input"
          :placeholder="placeholder"
          @keydown.enter="submit"
        />
      </div>

      <div class="modal-foot">
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" :disabled="!text.trim()" @click="submit">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-2);
}
</style>
