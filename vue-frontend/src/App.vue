<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { AppShell } from '@dataask/shared-ui'
import TopNav from './components/TopNav.vue'
import LeftRail from './components/LeftRail.vue'
import { toastText } from './lib/toast'

const route = useRoute()

/** 公开只读页（内嵌分享）不套登录壳 */
const isPublic = computed(() => route.meta.public === true)

/** 首页 / 讨论串 / 人工制品库共用左侧栏 */
const withRail = computed(() => ['home', 'thread', 'artifacts'].includes(String(route.name)))
</script>

<template>
  <router-view v-if="isPublic" />

  <AppShell v-else>
    <div class="app">
      <TopNav />
      <div class="app-body">
        <LeftRail v-if="withRail" />
        <div class="app-main">
          <router-view />
        </div>
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

.app-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.app-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
