<script setup lang="ts">
import LoginPage from './LoginPage.vue'
import { useSession } from '../lib/session'

const { ready, isLoggedIn } = useSession()
</script>

<template>
  <LoginPage v-if="ready && !isLoggedIn" />
  <slot v-else-if="ready" />
  <div v-else class="boot">加载中…</div>
</template>

<style scoped>
.boot {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 13px;
}
</style>
