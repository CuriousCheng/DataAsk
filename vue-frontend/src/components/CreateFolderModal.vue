<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; submit: [name: string] }>()

const name = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.open,
  async (open) => {
    if (open) {
      name.value = ''
      await nextTick()
      inputRef.value?.focus()
    }
  },
)

function submit() {
  const value = name.value.trim()
  if (!value) return
  emit('submit', value)
}
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true" aria-label="新建文件夹">
      <div class="modal-head">
        <h3 class="modal-title">新建文件夹</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <label class="field-label" for="folder-name">文件夹名称</label>
        <input
          id="folder-name"
          ref="inputRef"
          v-model="name"
          class="input"
          placeholder="文件夹名称"
          @keydown.enter="submit"
        />
      </div>

      <div class="modal-foot">
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" :disabled="!name.trim()" @click="submit">
          提交
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
