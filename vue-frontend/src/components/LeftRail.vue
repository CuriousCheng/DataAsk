<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronDown,
  Globe,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Archive,
  Plus,
  Settings,
  UserRound,
} from 'lucide-vue-next'
import { useWorkspaces } from '../stores/useWorkspaces'
import { openAiLanguage, openOrgSettings, openSettings, openUserSettings } from '../lib/settings'
import PromptModal from './PromptModal.vue'
import { projectName } from '../lib/threads'
import AccessModal from './AccessModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import { listThreads, deleteThread as apiDeleteThread, renameThread as renameThreadApi, type Thread } from '../lib/threads'
import { http } from '@dataask/shared-ui'

const router = useRouter()
const route = useRoute()
const {
  state,
  activeWorkspace,
  addWorkspace,
  renameWorkspace,
  removeWorkspace,
  setAccess,
  toggleCollapsed,
} = useWorkspaces()

const apiThreads = ref<Thread[]>([])
const artifactCount = ref(0)

async function reloadThreads() {
  try {
    apiThreads.value = await listThreads()
  } catch {
    apiThreads.value = []
  }
}

async function reloadArtifacts() {
  try {
    const r = await http.get<{ items: unknown[] }>('/api/artifacts')
    artifactCount.value = (r.items || []).length
  } catch {
    artifactCount.value = 0
  }
}

onMounted(() => {
  reloadThreads()
  reloadArtifacts()
})

const currentProject = projectName()

const LANGUAGES = ['English', '繁體中文', '简体中文', '日本語', '한국어', 'Español', 'Français']

const folderOpen = ref(false)
const lang = ref('简体中文')
const langOpen = ref(false)
const threadMenuId = ref<string | null>(null)
const settingsMenu = ref<{ x: number; y: number } | null>(null)

const createOpen = ref(false)
const renameOpen = ref(false)
const accessOpen = ref(false)
const deleteOpen = ref(false)

const activeThreadId = computed(() => String(route.params.threadId ?? ''))

function openThread(id: string) {
  router.push(`/${id}`)
}

function toggleSettingsMenu(e: MouseEvent) {
  if (settingsMenu.value) {
    settingsMenu.value = null
    return
  }
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  settingsMenu.value = { x: rect.left, y: rect.top - 6 }
}

function gotoSettings(target: 'project' | 'org' | 'agent' | 'user') {
  settingsMenu.value = null
  if (target === 'project') {
    openSettings()
    return
  }
  if (target === 'org') {
    openOrgSettings()
    return
  }
  if (target === 'agent') {
    openUserSettings('/settings/agent/skills')
    return
  }
  openUserSettings('/settings/user/profile')
}

function submitFolder(name: string) {
  addWorkspace(name)
  createOpen.value = false
  folderOpen.value = false
  router.push('/')
}

function submitRename(name: string) {
  renameWorkspace(activeWorkspace.value.id, name)
  renameOpen.value = false
}

function confirmDelete() {
  removeWorkspace(activeWorkspace.value.id)
  deleteOpen.value = false
  router.push('/')
}

function onAccessSave(payload: Parameters<typeof setAccess>[1]) {
  setAccess(activeWorkspace.value.id, payload)
  accessOpen.value = false
}

async function deleteThread(id: string) {
  if (!window.confirm('删除这个讨论串？')) return
  try {
    await apiDeleteThread(id)
  } catch {
    /* 忽略 */
  }
  await reloadThreads()
  threadMenuId.value = null
  if (activeThreadId.value === id) router.push('/')
}

async function doRenameThread(id: string) {
  const current = apiThreads.value.find((t) => t.id === id)
  const next = window.prompt('重命名讨论串', current?.title ?? '')
  if (next && next.trim()) {
    try {
      await renameThreadApi(id, next.trim())
      await reloadThreads()
    } catch {
      /* 忽略 */
    }
  }
  threadMenuId.value = null
}
</script>

<template>
  <!-- 收起态 -->
  <aside v-if="state.collapsed" class="rail collapsed">
    <button class="icon-btn" type="button" aria-label="展开侧栏" @click="toggleCollapsed">
      <PanelLeft :size="17" />
    </button>
    <button class="icon-btn" type="button" aria-label="讨论串" @click="router.push('/')">
      <MessageSquare :size="17" />
    </button>

    <div class="spacer-col" />

    <button class="icon-btn" type="button" aria-label="设置" @click="toggleSettingsMenu($event)">
      <Settings :size="17" />
    </button>
    <button class="icon-btn" type="button" aria-label="语言" @click="langOpen = !langOpen">
      <Globe :size="17" />
    </button>

    <div v-if="langOpen" class="pop lang-pop collapsed-lang">
      <button
        v-for="l in LANGUAGES"
        :key="l"
        class="pop-item"
        type="button"
        :data-active="lang === l"
        @click="lang = l; langOpen = false"
      >
        {{ l }}
      </button>
      <div class="pop-sep" />
      <button class="pop-item" type="button" @click="openAiLanguage()">
        <Settings :size="14" />
        AI 回应语言
      </button>
    </div>
  </aside>

  <!-- 展开态 -->
  <aside v-else class="rail">
    <div class="rail-head">
      <div class="ws-wrap">
        <span class="ws-btn static">
          <UserRound :size="14" />
          <span class="ws-name">{{ currentProject }}</span>
        </span>
      </div>

      <div class="head-actions">
        <button class="icon-btn" type="button" aria-label="收起侧栏" @click="toggleCollapsed">
          <PanelLeft :size="16" />
        </button>
      </div>
    </div>

    <div class="rail-body">
      <button class="section-head" type="button" @click="router.push('/artifacts')">
        <span class="section-title">
          <Archive :size="14" />
          人工制品 ({{ artifactCount }})
        </span>
        <ChevronRight :size="14" />
      </button>

      <div class="section-head static">
        <span class="section-title">
          <MessageSquare :size="14" />
          讨论串 ({{ apiThreads.length }})
        </span>
        <button class="add-btn" type="button" @click="router.push('/')">
          <Plus :size="12" />
          新建
        </button>
      </div>

      <div v-if="!apiThreads.length" class="section-empty">暂无讨论串</div>

      <div v-for="t in apiThreads" :key="t.id" class="thread-row">
        <button
          class="thread-item"
          type="button"
          :data-active="activeThreadId === t.id"
          @click="openThread(t.id)"
        >
          <span class="thread-title">{{ t.title }}</span>
        </button>
        <button
          class="thread-more"
          type="button"
          aria-label="讨论串菜单"
          @click.stop="threadMenuId = threadMenuId === t.id ? null : t.id"
        >
          <MoreHorizontal :size="15" />
        </button>

        <div v-if="threadMenuId === t.id" class="pop thread-pop" @mouseleave="threadMenuId = null">
          <button class="pop-item" type="button" @click="doRenameThread(t.id)">重命名</button>
          <button class="pop-item" type="button" @click="deleteThread(t.id)">删除</button>
        </div>
      </div>
    </div>

    <div class="rail-foot">
      <button class="icon-btn" type="button" aria-label="设置" @click="toggleSettingsMenu($event)">
        <Settings :size="16" />
      </button>

      <button class="lang-btn" type="button" @click="langOpen = !langOpen">
        <Globe :size="13" />
        {{ lang }}
        <ChevronDown :size="12" />
      </button>

      <div v-if="langOpen" class="pop lang-pop" @mouseleave="langOpen = false">
        <button
          v-for="l in LANGUAGES"
          :key="l"
          class="pop-item"
          type="button"
          :data-active="lang === l"
          @click="lang = l; langOpen = false"
        >
          {{ l }}
        </button>
        <div class="pop-sep" />
        <button class="pop-item" type="button" @click="openAiLanguage()">
          <Settings :size="14" />
          AI 回应语言
        </button>
      </div>
    </div>

    <PromptModal
      :open="createOpen"
      title="新建文件夹"
      label="文件夹名称"
      placeholder="文件夹名称"
      @close="createOpen = false"
      @submit="submitFolder"
    />
    <PromptModal
      :open="renameOpen"
      title="重命名文件夹"
      label="文件夹名称"
      :value="activeWorkspace.name"
      @close="renameOpen = false"
      @submit="submitRename"
    />
    <AccessModal
      :open="accessOpen"
      :workspace="activeWorkspace"
      @close="accessOpen = false"
      @save="onAccessSave"
    />
    <ConfirmModal
      :open="deleteOpen"
      title="删除文件夹"
      :desc="`确定要删除「${activeWorkspace.name}」吗？文件夹里的讨论串会一起删除，且无法恢复。`"
      @close="deleteOpen = false"
      @confirm="confirmDelete"
    />
  </aside>

  <div
    v-if="settingsMenu"
    class="settings-pop"
    :style="{ left: settingsMenu.x + 'px', top: settingsMenu.y + 'px' }"
    @mouseleave="settingsMenu = null"
  >
    <div class="pop-label">设置</div>
    <button class="pop-item" type="button" @click="gotoSettings('project')">项目</button>
    <button class="pop-item" type="button" @click="gotoSettings('org')">组织</button>
    <button class="pop-item" type="button" @click="gotoSettings('agent')">智能体功能</button>
    <button class="pop-item" type="button" @click="gotoSettings('user')">用户</button>
  </div>
</template>

<style scoped>
.rail {
  position: relative;
  width: var(--rail-w);
  flex: 0 0 var(--rail-w);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--rail);
  border-right: 1px solid var(--line);
}

/* 收起态 */
.rail.collapsed {
  width: 72px;
  flex: 0 0 72px;
  align-items: center;
  padding: 14px 0 12px;
  gap: 6px;
}

.rail.collapsed .icon-btn {
  width: 40px;
  height: 36px;
  border-radius: 8px;
  color: var(--text-2);
}

.rail.collapsed .icon-btn:hover {
  background: var(--hover);
}

.settings-pop {
  position: fixed;
  z-index: 70;
  min-width: 170px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
  transform: translateY(-100%);
}

.settings-pop .pop-label {
  padding: 4px 8px 6px;
  font-size: 12px;
  color: var(--text-3);
}

.spacer-col {
  flex: 1;
}

.collapsed-lang {
  left: 76px;
  bottom: 12px;
  min-width: 150px;
}

/* 展开态 */
.rail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 8px;
}

.ws-wrap {
  position: relative;
  min-width: 0;
}

.ws-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 190px;
  height: 30px;
  padding: 0 8px;
  border-radius: var(--radius);
  font-size: 13px;
}

.ws-btn:hover {
  background: var(--hover);
}

.ws-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ws-pop {
  top: 36px;
  left: 0;
  min-width: 230px;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.ws-more-wrap {
  position: relative;
}

.ws-menu {
  top: 34px;
  right: 0;
  min-width: 170px;
}

.ws-menu .danger {
  color: var(--danger);
}

.ws-menu .danger:hover {
  background: #fff1f0;
}

.rail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 8px 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 6px;
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 13px;
}

.section-head:hover {
  background: var(--hover);
}

.section-head.static {
  cursor: default;
}

.section-head.static:hover {
  background: transparent;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.section-empty {
  padding: 2px 12px 10px;
  font-size: 12px;
  color: var(--text-4);
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-2);
}

.add-btn:hover {
  background: #ececec;
}

.thread-row {
  position: relative;
  display: flex;
  align-items: center;
}

.thread-item {
  flex: 1;
  min-width: 0;
  height: 34px;
  padding: 0 6px 0 12px;
  border-radius: var(--radius);
  font-size: 13px;
  text-align: left;
}

.thread-item:hover {
  background: var(--hover);
}

.thread-item[data-active='true'] {
  background: #e9e9e9;
  font-weight: 500;
}

.thread-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread-more {
  position: absolute;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--text-3);
  opacity: 0;
}

.thread-row:hover .thread-more,
.thread-row:focus-within .thread-more {
  opacity: 1;
}

.thread-more:hover {
  background: #dcdcdc;
}

.thread-pop {
  top: 32px;
  right: 4px;
  min-width: 130px;
}

.rail-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid var(--line);
}

.lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 6px;
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--text-2);
}

.lang-btn:hover {
  background: var(--hover);
}

.lang-pop {
  left: 12px;
  bottom: 46px;
  min-width: 150px;
  padding: 4px;
}

.pop-item[data-active='true'] {
  background: var(--hover);
  color: var(--text);
  font-weight: 500;
}
</style>
