<script setup lang="ts">
import { BookOpen, ExternalLink, KeyRound, Link2, Plug, Sparkles } from 'lucide-vue-next'
import { showToast } from '../lib/toast'
</script>

<template>
  <div class="api">
    <aside class="subnav">
      <RouterLink class="nav-item" to="/mcp">
        <Plug :size="13" />
        MCP 接入
      </RouterLink>
      <RouterLink class="nav-item" to="/ai">
        <Sparkles :size="13" />
        AI 设置
      </RouterLink>
      <RouterLink class="nav-item" to="/history">
        <Link2 :size="13" />
        API 历史记录
      </RouterLink>
      <RouterLink class="nav-item" to="/keys">
        <KeyRound :size="13" />
        API 密钥
      </RouterLink>
      <button class="nav-item" type="button" @click="showToast('后端没有提供 API 文档接口')">
        <BookOpen :size="13" />
        API 参考文档
        <ExternalLink :size="12" />
      </button>

      <div class="spacer" />
    </aside>

    <section class="content">
      <router-view />
    </section>
  </div>
</template>

<style scoped>
.api {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.subnav {
  width: 240px;
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
  border-right: 1px solid var(--line);
  background: #fff;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px;
  border-radius: 6px;
  color: var(--text-2);
  font-size: 13px;
  text-decoration: none;
  background: transparent;
  cursor: pointer;
  border: 0;
}

.nav-item:hover {
  background: #f5f7fa;
}

.nav-item.router-link-active {
  background: #eef3ff;
  color: #1d39c4;
  font-weight: 500;
}

.spacer {
  flex: 1;
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  overflow: auto;
}
</style>
