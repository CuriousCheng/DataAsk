<template>
  <aside class="settings-nav">
    <div class="group-title">组织</div>
    <RouterLink class="nav-item" to="/general">常规</RouterLink>
    <RouterLink class="nav-item" to="/members">成员</RouterLink>
    <RouterLink class="nav-item" to="/users">用户</RouterLink>
    <RouterLink class="nav-item" to="/activity-log">活动日志</RouterLink>
    <RouterLink class="nav-item" to="/api-keys">API 密钥</RouterLink>
    <RouterLink class="nav-item" to="/mcp">MCP</RouterLink>
    <RouterLink class="nav-item" to="/system">系统设置</RouterLink>
    <RouterLink class="nav-item" to="/danger-zone">危险区域</RouterLink>
  </aside>
</template>

<style scoped>
.settings-nav {
  width: 232px;
  flex: 0 0 232px;
  padding: 14px 10px 24px;
  background: var(--rail);
  border-right: 1px solid var(--line);
  overflow-y: auto;
}

.group-title {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-3);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text);
}

.nav-item:hover {
  background: #efefef;
}

.nav-item.router-link-active {
  background: #e6e6e6;
  font-weight: 500;
}
</style>
