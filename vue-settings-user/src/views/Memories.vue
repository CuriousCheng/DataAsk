<script setup lang="ts">
import { user } from '../lib/user'
</script>

<template>
  <div class="page">
    <h1>记忆</h1>

    <p class="desc">
      个性化记忆会<strong>在每个项目中为你私密保存</strong>。智能体会按用户自动管理这些记忆以确保上下文准确，你可以在此查看或重置。
    </p>

    <div v-if="!user.memories.length" class="empty">
      <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden="true">
        <rect x="16" y="14" width="40" height="28" rx="4" fill="#ededed" />
        <path d="M16 22h40" stroke="#d9d9d9" stroke-width="2" />
        <path d="M26 14l4-6h12l4 6" stroke="#d9d9d9" stroke-width="2" fill="none" />
      </svg>
      <div class="empty-text">暂无记忆</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1300px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 14px;
}

.desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.7;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 90px 0;
}

.empty-text {
  font-size: 13px;
  color: var(--text-3);
}
</style>
