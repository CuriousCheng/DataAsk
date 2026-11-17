<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ open: boolean; title: string; desc?: string; confirmText?: string }>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal confirm" role="dialog" aria-modal="true" :aria-label="title">
      <div class="modal-head">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>
      <div class="modal-body">
        <p class="desc">{{ desc }}</p>
      </div>
      <div class="modal-foot">
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn danger" type="button" @click="emit('confirm')">
          {{ confirmText ?? '删除' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm {
  width: 440px;
}

.desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.7;
}

.danger {
  border-color: #ffa39e;
  background: #fff;
  color: var(--danger);
}

.danger:hover {
  background: #fff1f0;
}
</style>
