<script setup lang="ts">
import { AppShell } from '@dataask/shared-ui'
import TopNav from "./components/TopNav.vue"
import SettingsNav from "./components/SettingsNav.vue"
import { toastText } from "./lib/toast"
</script>

<template>
  <AppShell>
  <div class="app">
    <TopNav />
    <div class="body">
      <SettingsNav />
      <main class="content">
        <router-view />
      </main>
    </div>
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

.content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 24px 28px 80px;
}
</style>
