<script setup lang="ts">
import { AppShell } from '@dataask/shared-ui'
import TopNav from "./components/TopNav.vue"
import { toastText } from "./lib/toast"
</script>

<template>
  <AppShell>
  <div class="app">
    <TopNav />
    <main class="body">
      <router-view />
    </main>
    <div v-if="toastText" class="toast">{{ toastText }}</div>
  </div>
  </AppShell>
</template>


<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.body {
  flex: 1;
  min-height: 0;
  display: flex;
}
</style>
