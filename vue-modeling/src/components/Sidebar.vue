<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Box,
  ChevronDown,
  ChevronRight,
  Hash,
  Calendar,
  Type,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-vue-next'
import { modeling, relationsOf } from '../lib/modeling'
import { showToast } from '../lib/toast'

const props = defineProps<{ views: Array<{ name: string; description: string; statement: string }> }>()
const emit = defineEmits<{
  create: []
  focus: [name: string, column?: string]
  createView: []
  refreshViews: []
  openView: [view: { name: string; description: string; statement: string }]
}>()

const query = ref('')
const openModels = ref<Record<string, boolean>>({})

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return modeling.models.filter((m) => !q || m.name.toLowerCase().includes(q))
})

function isOpen(name: string) {
  return openModels.value[name] ?? false
}

function toggle(name: string) {
  openModels.value[name] = !isOpen(name)
}

function typeIcon(type: string) {
  if (type === 'INT64') return Hash
  if (type === 'DATE') return Calendar
  return Type
}
</script>

<template>
  <aside class="sidebar">
    <div class="search-row">
      <div class="search">
        <Search :size="14" />
        <input v-model="query" placeholder="搜索" />
      </div>
      <button class="icon-btn" type="button" aria-label="筛选" @click="showToast('筛选还没做')">
        <ListFilter :size="16" />
      </button>
    </div>

    <div class="section-head">
      <span class="section-title">模型 ({{ modeling.models.length }}/200)</span>
      <div class="section-actions">
        <button class="icon-btn sm" type="button" aria-label="显示全部" @click="showToast('显示全部还没做')">
          <Eye :size="15" />
        </button>
        <button class="icon-btn sm" type="button" aria-label="刷新" @click="showToast('已刷新')">
          <RefreshCw :size="15" />
        </button>
        <button class="btn btn-sm" type="button" @click="emit('create')">
          <Plus :size="13" />
          新建
        </button>
      </div>
    </div>

    <div class="tree">
      <div v-for="m in rows" :key="m.name" class="tree-model">
        <div class="model-row" :data-active="false" @click="emit('focus', m.name)">
          <button class="chev" type="button" @click.stop="toggle(m.name)">
            <component :is="isOpen(m.name) ? ChevronDown : ChevronRight" :size="13" />
          </button>
          <Box :size="14" class="cube" />
          <span class="model-name">{{ m.name }}</span>
          <button class="eye" type="button" aria-label="查看" @click.stop="emit('focus', m.name)">
            <Eye :size="14" />
          </button>
        </div>
        <div v-if="isOpen(m.name)" class="cols">
          <div v-for="c in m.columns" :key="c.name" class="col-row" @click.stop="emit('focus', m.name, c.alias)">
            <component :is="typeIcon(c.type)" :size="13" class="col-icon" />
            <span>{{ c.alias || c.name }}</span>
          </div>
          <div class="col-row muted">关系 ({{ relationsOf(m.name).length }})</div>
        </div>
      </div>
      <div v-if="!rows.length" class="empty-text">没有匹配的模型</div>
    </div>

    <div class="section-head views">
      <span class="section-title">视图 ({{ props.views.length }})</span>
      <div class="section-actions">
        <button class="icon-btn sm" type="button" aria-label="刷新视图" @click="emit('refreshViews')">
          <RefreshCw :size="15" />
        </button>
        <button class="btn btn-sm" type="button" @click="emit('createView')">
          <Plus :size="13" />
          新建
        </button>
      </div>
    </div>
    <div v-if="!props.views.length" class="empty-views">暂无视图</div>
    <button
      v-for="v in props.views"
      :key="v.name"
      class="view-item"
      type="button"
      @click="emit('openView', v)"
    >
      <span class="view-name">{{ v.name }}</span>
      <span class="view-desc">{{ v.description }}</span>
    </button>

    </aside>
</template>

<style scoped>
.sidebar {
  width: 300px;
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--rail);
  border-right: 1px solid var(--line);
}

.search-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 12px 8px;
}

.search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: #fff;
  color: var(--text-3);
}

.search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 8px;
}

.section-title {
  font-size: 13px;
  color: var(--text-2);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn.sm {
  width: 24px;
  height: 24px;
}

.tree {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 8px;
}

.model-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 6px;
  border-radius: 6px;
  cursor: pointer;
}

.model-row:hover {
  background: #efefef;
}

.chev {
  display: inline-flex;
  color: var(--text-3);
}

.cube {
  color: var(--text-2);
}

.model-name {
  flex: 1;
  font-size: 13px;
}

.eye {
  display: none;
  color: var(--text-3);
}

.model-row:hover .eye {
  display: inline-flex;
}

.cols {
  padding: 2px 0 6px 28px;
}

.col-row {
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  font-size: 12px;
  color: var(--text-2);
}

.col-row:hover {
  background: #ececec;
}

.col-row.muted {
  color: var(--text-3);
}

.col-icon {
  color: var(--text-4);
}

.views {
  border-top: 1px solid var(--line);
}

.view-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.view-item:hover {
  background: #f5f7fa;
}

.view-name {
  font-size: 12.5px;
}

.view-desc {
  font-size: 11.5px;
  color: var(--text-4);
}

.empty-views {
  padding: 0 20px 10px;
  font-size: 12px;
  color: var(--text-4);
}

.empty-text {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-4);
}



</style>
