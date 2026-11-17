<template>
  <aside class="settings-nav">
    <div class="group-title">智能体功能</div>
    <RouterLink class="nav-item" to="/agent/skills">技能</RouterLink>
    <RouterLink class="nav-item" to="/agent/memories">记忆</RouterLink>

    <div class="group-title" style="margin-top: 14px">用户</div>
    <RouterLink class="nav-item" to="/user/profile">个人资料</RouterLink>
    <RouterLink class="nav-item" to="/user/danger-zone">危险区域</RouterLink>
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
