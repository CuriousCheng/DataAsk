<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ open: boolean; title: string; width?: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal" :style="{ width: width ?? '480px' }" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-foot">
        <slot name="footer">
          <button class="btn" type="button" @click="emit('close')">取消</button>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-body {
  max-height: 64vh;
  overflow-y: auto;
}
</style>
