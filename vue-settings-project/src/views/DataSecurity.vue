<script setup lang="ts">
import { ref } from 'vue'
import { Database, ListFilter, ShieldCheck, Users } from 'lucide-vue-next'
import DataConnection from './DataConnection.vue'

type Tab = 'sources' | 'row' | 'column' | 'session'

const tab = ref<Tab>('sources')

const TABS: { key: Tab; label: string; icon: unknown }[] = [
  { key: 'sources', label: '数据源', icon: Database },
  { key: 'row', label: '行级安全性', icon: ShieldCheck },
  { key: 'column', label: '列级安全性', icon: ListFilter },
  { key: 'session', label: '会话属性', icon: Users },
]
</script>

<template>
  <div class="security">
    <div class="head">
      <h1>数据安全</h1>
      <p class="sub">
        数据源接入与访问控制。数据源保存后会注册成 Trino 的 catalog，建模时就能看到这些库的表。
      </p>
    </div>

    <div class="tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        class="tab"
        type="button"
        :data-active="tab === t.key"
        @click="tab = t.key"
      >
        <component :is="t.icon" :size="14" />
        {{ t.label }}
      </button>
    </div>

    <div class="body">
      <DataConnection v-if="tab === 'sources'" />

      <div v-else class="placeholder">
        <ShieldCheck :size="26" />
        <p class="t">
          {{ tab === 'row' ? '行级安全性' : tab === 'column' ? '列级安全性' : '会话属性' }}
        </p>
        <p class="d">
          这个功能后端还没有权限模型，页面先留位，不做假数据。
          需要先定义：策略存储、会话属性来源（用户 / 组）、以及 SQL 重写时如何注入条件。
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.security {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.head {
  padding: 18px 24px 10px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

.sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-3);
}

.tabs {
  display: flex;
  gap: 8px;
  padding: 0 24px 12px;
  border-bottom: 1px solid var(--line);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-2);
}

.tab[data-active='true'] {
  border-color: #3157c4;
  background: #eef3ff;
  color: #1d39c4;
}

.body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 24px 24px;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 80px 20px;
  color: var(--text-3);
  text-align: center;
}

.placeholder .t {
  font-size: 15px;
  color: var(--text-2);
  font-weight: 500;
}

.placeholder .d {
  max-width: 560px;
  font-size: 12.5px;
  line-height: 1.9;
}
</style>
