<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, ChevronDown, Globe, Lock, Search, UserRound, X } from 'lucide-vue-next'
import { DIRECTORY, type AccessMode, type Workspace } from '../stores/useWorkspaces'

const props = defineProps<{ open: boolean; workspace: Workspace | null }>()
const emit = defineEmits<{
  close: []
  save: [payload: { access: AccessMode; members: string[]; groups: string[] }]
}>()

const MODES: { key: AccessMode; title: string; desc: string }[] = [
  { key: 'project', title: '项目内任何人', desc: '项目内任何人都可以查看此文件夹' },
  { key: 'private', title: '私有', desc: '只有你可以查看和管理此文件夹' },
  { key: 'people', title: '指定人员', desc: '只有项目中被选取的人员可以访问此文件夹' },
]

const mode = ref<AccessMode>('private')
const modeOpen = ref(false)
const tab = ref<'members' | 'groups'>('members')
const pickedMembers = ref<string[]>([])
const pickedGroups = ref<string[]>([])
const memberDraft = ref('')
const groupDraft = ref('')

const current = computed(() => MODES.find((m) => m.key === mode.value) ?? MODES[1])

watch(
  () => props.open,
  (open) => {
    if (!open || !props.workspace) return
    mode.value = props.workspace.access
    pickedMembers.value = [...props.workspace.members]
    pickedGroups.value = [...props.workspace.groups]
    tab.value = 'members'
    modeOpen.value = false
    memberDraft.value = ''
    groupDraft.value = ''
  },
)

function save() {
  emit('save', {
    access: mode.value,
    members: pickedMembers.value,
    groups: pickedGroups.value,
  })
}

function pickMode(key: AccessMode) {
  mode.value = key
  modeOpen.value = false
}

function addMember() {
  if (!memberDraft.value) return
  if (!pickedMembers.value.includes(memberDraft.value)) pickedMembers.value.push(memberDraft.value)
  memberDraft.value = ''
}

function addGroup() {
  if (!groupDraft.value) return
  if (!pickedGroups.value.includes(groupDraft.value)) pickedGroups.value.push(groupDraft.value)
  groupDraft.value = ''
}
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal access-modal" role="dialog" aria-modal="true" aria-label="管理访问权限">
      <div class="modal-head">
        <h3 class="modal-title">管理访问权限</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="body">
        <div class="label">访问模式</div>

        <div class="mode-wrap">
          <button class="mode-trigger" type="button" @click="modeOpen = !modeOpen">
            <span class="mode-main">
              <span class="mode-title">
                <Lock v-if="current.key === 'private'" :size="15" />
                <Globe v-else-if="current.key === 'project'" :size="15" />
                <UserRound v-else :size="15" />
                {{ current.title }}
              </span>
              <span class="mode-desc">{{ current.desc }}</span>
            </span>
            <ChevronDown :size="16" />
          </button>

          <div v-if="modeOpen" class="pop mode-pop">
            <button
              v-for="m in MODES"
              :key="m.key"
              class="pop-item mode-item"
              type="button"
              :data-active="mode === m.key"
              @click="pickMode(m.key)"
            >
              <span class="mode-title">
                <Lock v-if="m.key === 'private'" :size="15" />
                <Globe v-else-if="m.key === 'project'" :size="15" />
                <UserRound v-else :size="15" />
                {{ m.title }}
                <Check v-if="mode === m.key" :size="15" class="check" />
              </span>
              <span class="mode-desc">{{ m.desc }}</span>
            </button>
          </div>
        </div>

        <template v-if="mode === 'people'">
          <div class="tabs">
            <button
              class="tab"
              type="button"
              :data-active="tab === 'members'"
              @click="tab = 'members'"
            >
              管理成员
            </button>
            <button class="tab" type="button" :data-active="tab === 'groups'" @click="tab = 'groups'">
              管理群组
            </button>
          </div>

          <div v-if="tab === 'members'">
            <div class="label">添加成员</div>
            <div class="add-row">
              <select v-model="memberDraft" class="select">
                <option value="">选择一个或多个项目成员</option>
                <option v-for="m in DIRECTORY.members" :key="m.id" :value="m.id">{{ m.label }}</option>
              </select>
              <button
                class="btn"
                type="button"
                :disabled="!memberDraft"
                @click="addMember"
              >
                新增
              </button>
            </div>

            <div class="label">当前成员</div>
            <div class="table-wrap">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>
                      名称
                      <span class="th-icons">⇅ <Search :size="12" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="id in pickedMembers" :key="id">
                    <td>
                      <span class="avatar">AH</span>
                      {{ DIRECTORY.members.find((m) => m.id === id)?.label ?? id }}
                      <button
                        class="remove"
                        type="button"
                        aria-label="移除"
                        @click="pickedMembers = pickedMembers.filter((x) => x !== id)"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!pickedMembers.length">
                    <td class="empty-cell">暂无数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else>
            <div class="label">添加群组</div>
            <div class="add-row">
              <select v-model="groupDraft" class="select">
                <option value="">选择一个或多个项目群组</option>
                <option v-for="g in DIRECTORY.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
              <button
                class="btn"
                type="button"
                :disabled="!groupDraft"
                @click="addGroup"
              >
                新增
              </button>
            </div>

            <div class="label">当前群组</div>
            <div class="table-wrap">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>
                      名称
                      <span class="th-icons">⇅ <Search :size="12" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="id in pickedGroups" :key="id">
                    <td>
                      {{ DIRECTORY.groups.find((g) => g.id === id)?.name ?? id }}
                      <button
                        class="remove"
                        type="button"
                        aria-label="移除"
                        @click="pickedGroups = pickedGroups.filter((x) => x !== id)"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!pickedGroups.length">
                    <td class="empty-cell">暂无数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>

      <div class="modal-foot">
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.access-modal {
  width: 600px;
}

.body {
  max-height: 62vh;
  overflow-y: auto;
  padding-right: 4px;
}

.label {
  margin: 4px 0 8px;
  font-size: 13px;
  color: var(--text-2);
}

.mode-wrap {
  position: relative;
  margin-bottom: 18px;
}

.mode-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  text-align: left;
}

.mode-trigger:hover {
  border-color: #bfbfbf;
}

.mode-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text);
}

.mode-desc {
  font-size: 12px;
  color: var(--text-3);
}

.mode-pop {
  top: 56px;
  left: 0;
  right: 0;
  padding: 6px;
}

.mode-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  height: auto;
  padding: 10px 12px;
}

.mode-item .check {
  margin-left: auto;
  color: var(--blue);
}

.tabs {
  display: flex;
  gap: 22px;
  margin: 6px 0 14px;
  border-bottom: 1px solid var(--line);
}

.tab {
  position: relative;
  height: 36px;
  font-size: 13px;
  color: var(--text-2);
}

.tab[data-active='true'] {
  color: var(--blue);
}

.tab[data-active='true']::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--blue);
}

.add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.select {
  flex: 1;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: #fff;
  color: var(--text-3);
  font-size: 13px;
  outline: none;
}

.table-wrap {
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.mini-table th {
  height: 40px;
  padding: 0 14px;
  text-align: left;
  font-weight: 500;
  color: var(--text-2);
  background: #fafafa;
  border-bottom: 1px solid var(--line);
}

.th-icons {
  float: right;
  display: inline-flex;
  gap: 6px;
  color: var(--text-3);
}

.mini-table td {
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid #f2f2f2;
}

.mini-table tr:last-child td {
  border-bottom: none;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  border-radius: 999px;
  background: #22c55e;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.remove {
  float: right;
  color: var(--text-3);
  font-size: 16px;
}

.empty-cell {
  color: var(--text-4);
  text-align: center;
  height: 88px;
}
</style>
