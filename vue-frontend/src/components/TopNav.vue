<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {


  Check,
  ChevronDown,
  Copy,
  LogOut,
  Mail,
  Map,
  Plus,
  Trash2,
} from 'lucide-vue-next'
import BrandMark from './BrandMark.vue'
import CreateOrgModal from './CreateOrgModal.vue'
import CreateProjectModal from './CreateProjectModal.vue'
import { ProjectSwitcher, link } from '@dataask/shared-ui'
import ConfirmModal from './ConfirmModal.vue'
import { useWorkspaces } from '../stores/useWorkspaces'
import { showToast } from '../lib/toast'
import { consoleUrl, trinoUrl, useAuth } from '@dataask/shared-ui'
import { openOrgSettings, openUserSettings } from '../lib/settings'


function openConsole() {
  window.open(consoleUrl(), '_blank', 'noopener')
}

function openTrino() {
  window.open(trinoUrl(), '_blank', 'noopener')
}

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
const { user } = useAuth()
const avatarText = computed(() => (user.value?.name || 'AD').slice(0, 2).toUpperCase())

const route = useRoute()
const router = useRouter()
const {
  state,
  activeOrg,
  orgProjects,
  setActiveOrg,
  addOrg,
  removeOrg,
  addProject,
  removeProject,
} = useWorkspaces()

const menu = ref<'org' | 'project' | 'user' | null>(null)

const orgModal = ref(false)
const projectModal = ref(false)
const orgDeleteId = ref<string | null>(null)
const projectDeleteId = ref<string | null>(null)

const isHome = computed(() => route.name === 'home' || route.name === 'thread')

function toggle(name: 'org' | 'user') {
  menu.value = menu.value === name ? null : name
}

function pickOrg(id: string) {
  setActiveOrg(id)
  menu.value = null
  router.push('/')
}

function copyOrgId() {
  const text = String(activeOrg.value.code)
  navigator.clipboard?.writeText(text).then(
    () => showToast(`已复制组织 ID：${text}`),
    () => showToast(`组织 ID：${text}`),
  )
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
        <button class="tab" type="button" :data-active="isHome" @click="onNav('首页')">首页</button>
        <button class="tab" type="button" @click="onNav('建模')">建模</button>
        <button class="tab" type="button" @click="onNav('知识')">知识</button>
        <button class="tab" type="button" @click="onNav('API')">API</button>
        <button class="tab" type="button" @click="onNav('数据安全')">数据安全</button>
      </nav>
    </div>

    <div class="center-actions">
      <button class="ext" type="button" title="打开 wren-console 原版界面（新标签页）" @click="openConsole">Console</button>
      <button class="ext" type="button" title="打开 Trino UI（新标签页）" @click="openTrino">Trino</button>
    </div>

    <div class="scope">
      <!-- 组织 -->
      <div class="scope-wrap">
        <button class="scope-btn" type="button" @click="toggle('org')">
          <span>{{ activeOrg?.name }}</span>
          <ChevronDown :size="14" />
        </button>

        <div v-if="menu === 'org'" class="pop scope-pop org-pop" @mouseleave="menu = null">
          <div class="pop-label">组织</div>
          <button class="new-btn" type="button" @click="orgModal = true; menu = null">
            <Plus :size="14" />
            新建组织
          </button>
          <div class="org-list">
            <div v-for="o in state.orgs" :key="o.id" class="org-row">
              <button
                class="org-item"
                type="button"
                :data-active="o.id === state.activeOrgId"
                @click="pickOrg(o.id)"
              >
                <span class="org-avatar">{{ o.name.slice(0, 1) }}</span>
                <span class="org-name">{{ o.name }}</span>
                <Check v-if="o.id === state.activeOrgId" :size="14" class="check" />
              </button>
              <button
                v-if="state.orgs.length > 1"
                class="row-delete"
                type="button"
                aria-label="删除组织"
                @click.stop="orgDeleteId = o.id"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <span class="sep">/</span>

      <!-- 项目：真实业务列表 -->
      <ProjectSwitcher />
    </div>

    <div class="right">
      <button class="avatar" type="button" title="账号" @click="toggle('user')">{{ avatarText }}</button>

      <div v-if="menu === 'user'" class="pop user-pop" @mouseleave="menu = null">
        <div class="pop-label">登录身份</div>
        <button class="user-mail" type="button" @click="openUserSettings()">
          <Mail :size="14" />
          ahsx@example.com
        </button>

        <div class="pop-sep" />

        <div class="pop-label">当前组织</div>
        <button class="user-org" type="button" @click="openOrgSettings()">
          <span class="org-avatar">{{ activeOrg?.name.slice(0, 1) }}</span>
          <span class="user-org-main">
            <span class="org-name">{{ activeOrg?.name }}</span>
            <span class="org-id">
              ID: {{ activeOrg?.code }}
              <span class="copy" @click.stop="copyOrgId"><Copy :size="12" /></span>
            </span>
          </span>
        </button>

        <div class="pop-sep" />

        <button class="pop-item" type="button" @click="showToast('产品路线图还没做')">
          <Map :size="14" />
          产品路线图
        </button>
        <button class="pop-item" type="button" @click="showToast('退出登录还没做')">
          <LogOut :size="14" />
          退出登录
        </button>
      </div>
    </div>

    <CreateOrgModal
      :open="orgModal"
      @close="orgModal = false"
      @submit="
        (payload) => {
          addOrg(payload.name, payload.timezone)
          orgModal = false
        }
      "
    />
    <CreateProjectModal
      :open="projectModal"
      @close="projectModal = false"
      @submit="
        (payload) => {
          addProject(payload.name, payload.kind)
          projectModal = false
        }
      "
    />
    <ConfirmModal
      :open="!!orgDeleteId"
      title="删除组织"
      desc="删除组织会连同它下面的项目一起删除，且无法恢复。"
      @close="orgDeleteId = null"
      @confirm="
        () => {
          if (orgDeleteId) removeOrg(orgDeleteId)
          orgDeleteId = null
        }
      "
    />
    <ConfirmModal
      :open="!!projectDeleteId"
      title="删除项目"
      :desc="`确定要删除「${orgProjects.find((p) => p.id === projectDeleteId)?.name ?? ''}」吗？项目下的模型、知识与讨论串会一起删除。`"
      @close="projectDeleteId = null"
      @confirm="
        () => {
          if (projectDeleteId) removeProject(projectDeleteId)
          projectDeleteId = null
        }
      "
    />
  </header>
</template>

<style scoped>
.topnav {
  position: relative;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--nav-h);
  padding: 0 16px 0 18px;
  background: var(--nav-bg);
  color: #fff;
  flex: 0 0 auto;
  overflow: visible;
}

.left {
  display: flex;
  align-items: center;
  gap: 22px;
  min-width: 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  color: #fff;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius);
  color: var(--nav-text);
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
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

.scope {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  margin-right: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.scope-wrap {
  position: relative;
}

.scope-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 6px;
  border-radius: var(--radius);
  color: #fff;
  max-width: 240px;
}

.scope-btn:hover {
  background: var(--nav-hover);
}

.scope-btn span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sep {
  color: rgba(255, 255, 255, 0.28);
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
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

/* 下拉统一 */
.scope-pop {
  top: 38px;
  right: 0;
  left: auto;
  width: 320px;
  padding: 10px;
  color: var(--text);
}

.org-pop {
  width: 360px;
}

.project-pop {
  width: 340px;
}

.pop-label {
  padding: 2px 6px 8px;
  font-size: 12px;
  color: var(--text-3);
}

.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 34px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text);
}

.new-btn:hover {
  background: var(--hover);
}

.org-list,
.project-list {
  margin-top: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.org-row,
.project-row {
  position: relative;
  display: flex;
  align-items: center;
}

.org-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  padding: 8px 6px;
  border-radius: 6px;
  text-align: left;
}

.org-item[data-active='true'] {
  background: #eef4ff;
}

.org-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: 6px;
  background: #93b4f5;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.org-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.check {
  color: var(--blue);
}

.row-delete {
  position: absolute;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: var(--text-3);
  opacity: 0;
}

.org-row:hover .row-delete,
.project-row:hover .row-delete {
  opacity: 1;
}

.row-delete:hover {
  background: #ffece8;
  color: var(--danger);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 8px;
  margin-bottom: 6px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  color: var(--text-3);
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  padding: 9px 8px;
  border-radius: 6px;
  text-align: left;
}

.project-item:hover {
  background: var(--hover);
}

.project-item[data-active='true'] {
  background: #eef4ff;
}

.project-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.badge {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  color: var(--text-3);
  font-size: 12px;
}

.pop-empty {
  padding: 12px;
  font-size: 12px;
  color: var(--text-4);
  text-align: center;
}

/* 用户菜单 */
.user-pop {
  top: 38px;
  right: 0;
  width: 340px;
  padding: 10px;
  color: var(--text);
}

.user-mail {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 10px;
  font-size: 13px;
  color: var(--text);
}

.user-org {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px;
  border-radius: 6px;
  text-align: left;
}

.user-org:hover {
  background: var(--hover);
}

.user-org-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.org-id {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.copy {
  display: inline-flex;
  padding: 2px;
  border-radius: 3px;
  color: var(--text-3);
}

.copy:hover {
  background: var(--hover);
  color: var(--text);
}

.user-pop .pop-item {
  gap: 8px;
}
.center-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
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
</style>
