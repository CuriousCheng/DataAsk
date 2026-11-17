<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import BrandMark from './BrandMark.vue'
import { NAV_ITEMS, consoleUrl, goNav, trinoUrl, type NavKey } from '../lib/nav'
import { showToast } from '../lib/toast'
import { useAuth } from '../lib/auth'

withDefaults(
  defineProps<{
    active?: NavKey | null
    orgName?: string
    projectName?: string
  }>(),
  { active: null, orgName: '示例科技有限公司', projectName: 'Default Project' },
)

const { user, isLoggedIn, logout } = useAuth()

function openConsole() {
  window.open(consoleUrl(), '_blank', 'noopener')
}

function openTrino() {
  window.open(trinoUrl(), '_blank', 'noopener')
}

function onNav(label: NavKey) {
  if (!goNav(label)) showToast('数据安全还没做')
}
</script>

<template>
  <header class="topnav">
    <div class="left">
      <button class="brand" type="button" @click="onNav('首页')">
        <BrandMark :size="26" />
        <span class="brand-name">DataAsk</span>
      </button>
      <nav class="tabs">
        <button
          v-for="n in NAV_ITEMS"
          :key="n"
          class="tab"
          type="button"
          :data-active="active === n"
          @click="onNav(n)"
        >
          {{ n }}
        </button>
      </nav>
    </div>

    <div class="center-actions">
      <button class="ext" type="button" title="打开 wren-console 原版界面（新标签页）" @click="openConsole">Console</button>
      <button class="ext" type="button" title="打开 Trino UI（新标签页）" @click="openTrino">Trino</button>
    </div>

    <div class="scope">
      <span class="scope-text">{{ orgName }} <ChevronDown :size="14" /></span>
      <span class="sep">/</span>
      <span class="scope-text">{{ projectName }} <ChevronDown :size="14" /></span>
    </div>

    <div class="right">
      <span v-if="isLoggedIn" class="who">{{ user?.name }}</span>
      <button class="avatar" type="button" :title="user ? '点击退出登录' : '未登录'" @click="logout">
        {{ (user?.name || 'AD').slice(0, 2).toUpperCase() }}
      </button>
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

.tab[data-active='true'] {
  background: var(--nav-active);
  color: #fff;
  font-weight: 500;
}

.center-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.scope {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 16px;
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

.right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ext {
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
}

.ext:hover {
  background: rgba(255, 255, 255, 0.1);
}

.who {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.who {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
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
