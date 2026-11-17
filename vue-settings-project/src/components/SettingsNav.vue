<template>
  <aside class="settings-nav">
    <div class="group-title">项目</div>
    <RouterLink class="nav-item" to="/general">常规</RouterLink>
    <RouterLink class="nav-item" to="/businesses">业务管理</RouterLink>
    <RouterLink class="nav-item" to="/data-connection">数据连接</RouterLink>
    <RouterLink class="nav-item" to="/data-security">数据安全</RouterLink>
    <RouterLink class="nav-item" to="/embed-threads">
      内嵌讨论串
      <span class="badge">(测试版)</span>
    </RouterLink>
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

.nav-item.disabled {
  color: var(--text-4);
  cursor: default;
}

.nav-item.disabled:hover {
  background: transparent;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  background: #fff3d6;
  color: #b26a00;
  font-size: 12px;
}
</style>
