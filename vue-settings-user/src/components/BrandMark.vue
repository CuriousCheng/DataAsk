<script setup lang="ts">
withDefaults(defineProps<{ size?: number; color?: string }>(), {
  size: 24,
  color: '#ffffff',
})
</script>

<template>
  <!-- 自绘标识：对话气泡 + 柱状图，不使用任何第三方商标图形 -->
  <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path
      d="M5 7.5A3.5 3.5 0 0 1 8.5 4h15A3.5 3.5 0 0 1 27 7.5v11a3.5 3.5 0 0 1-3.5 3.5H14l-6.2 5v-5H8.5A3.5 3.5 0 0 1 5 18.5v-11Z"
      :stroke="color"
      stroke-width="1.9"
      stroke-linejoin="round"
    />
    <rect x="11" y="14" width="2.6" height="4.4" rx="1.3" :fill="color" />
    <rect x="15.2" y="10.6" width="2.6" height="7.8" rx="1.3" :fill="color" />
    <rect x="19.4" y="12.6" width="2.6" height="5.8" rx="1.3" :fill="color" />
  </svg>
</template>
