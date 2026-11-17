<script setup lang="ts">
import { ProjectSwitcher, link } from '@dataask/shared-ui'
import BrandMark from './BrandMark.vue'
import { user } from '../lib/user'




function go(path: string) {
  window.location.href = link(path)
}

function onNav(label: string) {
  if (label === '首页') return go('/home/')
  if (label === '建模') return go('/modeling/')
  if (label === '知识') return go('/knowledge/file-explorer')
  if (label === 'API') return go('/api-management/history')
  go('/settings/project/data-security')
}
const NAV = ['首页', '建模', '知识', 'API', '数据安全']


</script>

<template>
  <header class="topnav">
    <div class="left">
      <button class="brand" type="button" @click="onNav('首页')">
        <BrandMark :size="26" />
        <span class="brand-name">DataAsk</span>
      </button>
      <nav class="tabs">
        <button v-for="n in NAV" :key="n" class="tab" type="button" @click="onNav(n)">
          {{ n }}
        </button>
      </nav>
    </div>

    <div class="scope">
      <span class="scope-text">示例科技有限公司</span>
      <span class="sep">/</span>
      <ProjectSwitcher />
    </div>

    <div class="right">
      <span class="avatar">{{ user.profile.firstName.slice(0, 1) }}{{ user.profile.lastName.slice(0, 1) }}</span>
    </div>
  </header>
</template>

<style scoped>
.topnav {
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--nav-h);
  padding: 0 16px 0 18px;
  background: var(--nav-bg);
  color: #fff;
  flex: 0 0 auto;
}

.left {
  display: flex;
  align-items: center;
  gap: 22px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius);
  color: var(--nav-text);
  font-size: 14px;
}

.tab:hover {
  background: var(--nav-hover);
  color: #fff;
}

.scope {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  margin-right: 12px;
  color: #fff;
  font-size: 13px;
}

.scope-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 6px;
  border-radius: var(--radius);
}

.sep {
  color: rgba(255, 255, 255, 0.3);
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #d9b382;
  color: #3d2b12;
  font-size: 12px;
  font-weight: 600;
}
</style>
