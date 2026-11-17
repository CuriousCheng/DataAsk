<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ChevronRight,
  FileCode,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-vue-next'
import Modal from '../components/Modal.vue'
import { showToast } from '../lib/toast'
import { http } from '@dataask/shared-ui'
import {
  buildTree,
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  fileKind,
  isCollapsed,
  kb,
  loadTree,
  openFile,
  renameFile,
  saveFile,
  toggle,
  TEMPLATES,
  type TreeNode,
} from '../lib/kb'

const rows = computed(() => {
  const out: { node: TreeNode; depth: number }[] = []
  const walk = (nodes: TreeNode[], depth: number) => {
    nodes.forEach((n) => {
      out.push({ node: n, depth })
      if (n.dir && !isCollapsed(n.path)) walk(n.children, depth + 1)
    })
  }
  walk(buildTree(), 0)
  return out
})

const fileCount = computed(() => kb.files.length)
const folderCount = computed(() => kb.dirs.length)

const createOpen = ref(false)
const createKind = ref<'file' | 'folder'>('file')
const newPath = ref('')
const newBody = ref('')
const templateKey = ref('rule')

const indexing = ref(false)
const renameOpen = ref(false)
const renameFrom = ref('')
const renameTo = ref('')

onMounted(() => loadTree())

function applyTemplate(key: string) {
  templateKey.value = key
  const t = TEMPLATES.find((x) => x.key === key)
  if (!t) return
  newPath.value = t.path
  newBody.value = t.body
}

function openCreate(kind: 'file' | 'folder') {
  createKind.value = kind
  newPath.value = kind === 'folder' ? 'knowledge/new-folder' : ''
  newBody.value = ''
  if (kind === 'file') applyTemplate('rule')
  createOpen.value = true
}

async function submitCreate() {
  const p = newPath.value.trim().replace(/^\/+|\/+$/g, '')
  if (!p) {
    showToast('先填路径')
    return
  }
  try {
    if (createKind.value === 'folder') {
      await createFolder(p)
      showToast('文件夹已创建')
    } else {
      await createFile(p, newBody.value)
      showToast('文件已创建')
    }
    createOpen.value = false
  } catch (e) {
    showToast(e instanceof Error ? e.message : '创建失败')
  }
}

function openRename(path: string) {
  renameFrom.value = path
  renameTo.value = path
  renameOpen.value = true
}

async function submitRename() {
  const to = renameTo.value.trim()
  if (!to || to === renameFrom.value) {
    renameOpen.value = false
    return
  }
  try {
    await renameFile(renameFrom.value, to)
    showToast('已重命名')
    renameOpen.value = false
  } catch (e) {
    showToast(e instanceof Error ? e.message : '重命名失败')
  }
}

async function buildIndex() {
  indexing.value = true
  try {
    const r = await http.post<{ ok: boolean; output: string }>(
      '/api/projects/' + encodeURIComponent(kb.project) + '/index',
      {},
    )
    const tail = (r.output || '').split('\n').filter(Boolean).slice(-2).join(' ')
    showToast(r.ok ? '索引完成：' + tail.slice(0, 80) : '索引失败：' + tail.slice(0, 80))
  } catch (e) {
    showToast(e instanceof Error ? e.message : '索引失败')
  } finally {
    indexing.value = false
  }
}

async function removeFile(path: string) {
  if (!window.confirm('删除文件 ' + path + ' ？')) return
  try {
    await deleteFile(path)
    showToast('已删除')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '删除失败')
  }
}

async function removeFolder(path: string) {
  if (!window.confirm('删除文件夹 ' + path + ' 及其下所有文件？')) return
  try {
    await deleteFolder(path)
    showToast('已删除')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '删除失败')
  }
}

async function doSave() {
  if (!kb.active) return
  try {
    await saveFile()
    showToast('已保存')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '保存失败')
  }
}

function onEdit(e: Event) {
  kb.content = (e.target as HTMLTextAreaElement).value
  kb.dirty = true
}

function iconOf(node: TreeNode) {
  if (node.dir) return isCollapsed(node.path) ? Folder : FolderOpen
  return fileKind(node.path) === 'Markdown' ? FileText : FileCode
}
</script>

<template>
  <div class="page">
    <div class="head">
      <div class="title">
        <h1>知识</h1>
        <span class="proj">{{ kb.project || '—' }}</span>
        <span class="stat">{{ fileCount }} 文件 · {{ folderCount }} 目录</span>
      </div>
      <div class="actions">
        <button class="btn" type="button" @click="loadTree()">
          <RefreshCw :size="14" />
          刷新
        </button>
        <button class="btn" type="button" @click="openCreate('folder')">
          <FolderPlus :size="14" />
          新建文件夹
        </button>
        <button class="btn" type="button" :disabled="indexing" @click="buildIndex">
          {{ indexing ? '建索引…' : '建记忆索引' }}
        </button>
        <button class="btn btn-primary" type="button" @click="openCreate('file')">
          <FilePlus2 :size="14" />
          新建文件
        </button>
      </div>
    </div>

    <p v-if="kb.error" class="err">{{ kb.error }}</p>

    <div class="body">
      <aside class="tree">
        <p v-if="kb.loading" class="hint">加载中…</p>
        <p v-else-if="!rows.length" class="hint">这个业务还没有文件</p>
        <div
          v-for="row in rows"
          :key="row.node.path"
          class="row"
          :class="{ on: !row.node.dir && kb.active === row.node.path }"
          :style="{ paddingLeft: 8 + row.depth * 14 + 'px' }"
          @click="row.node.dir ? toggle(row.node.path) : openFile(row.node.path)"
        >
          <ChevronRight
            v-if="row.node.dir"
            :size="13"
            class="chev"
            :class="{ open: !isCollapsed(row.node.path) }"
          />
          <span v-else class="chev-space" />
          <component :is="iconOf(row.node)" :size="14" class="ico" />
          <span class="name">{{ row.node.name }}</span>
          <span class="ops" @click.stop>
            <button class="op" type="button" title="重命名" @click="openRename(row.node.path)">
              <Pencil :size="12" />
            </button>
            <button class="op" type="button" title="删除" @click="row.node.dir ? removeFolder(row.node.path) : removeFile(row.node.path)">
              <Trash2 :size="12" />
            </button>
          </span>
        </div>
      </aside>

      <section class="editor">
        <template v-if="kb.active">
          <div class="bar">
            <code class="path">{{ kb.active }}</code>
            <span class="kind">{{ fileKind(kb.active) }}</span>
            <span v-if="kb.dirty" class="dirty">未保存</span>
            <span class="spacer" />
            <button class="btn btn-primary" type="button" :disabled="kb.saving" @click="doSave">
              <Save :size="14" />
              {{ kb.saving ? '保存中…' : '保存' }}
            </button>
          </div>
          <textarea class="code" :value="kb.content" spellcheck="false" @input="onEdit" />
        </template>
        <div v-else class="empty">左边选一个文件；也可以新建文件夹或文件</div>
      </section>
    </div>

    <Modal
      :open="createOpen"
      :title="createKind === 'folder' ? '新建文件夹' : '新建文件'"
      width="560px"
      @close="createOpen = false"
    >
      <div v-if="createKind === 'file'" class="row-line">
        <label>模板</label>
        <select class="input" :value="templateKey" @change="applyTemplate(($event.target as HTMLSelectElement).value)">
          <option v-for="t in TEMPLATES" :key="t.key" :value="t.key">{{ t.label }}</option>
        </select>
      </div>
      <div class="row-line">
        <label>路径</label>
        <input v-model="newPath" class="input" placeholder="knowledge/rules/my-rule.md" />
      </div>
      <div v-if="createKind === 'file'" class="row-line">
        <label>内容</label>
        <textarea v-model="newBody" class="small" spellcheck="false" />
      </div>
      <p class="hint">路径相对业务目录；父目录不存在会自动创建。</p>
      <template #footer>
        <button class="btn" type="button" @click="createOpen = false">取消</button>
        <button class="btn btn-primary" type="button" @click="submitCreate">创建</button>
      </template>
    </Modal>

    <Modal :open="renameOpen" title="重命名" width="480px" @close="renameOpen = false">
      <div class="row-line">
        <label>新路径</label>
        <input v-model="renameTo" class="input" />
      </div>
      <template #footer>
        <button class="btn" type="button" @click="renameOpen = false">取消</button>
        <button class="btn btn-primary" type="button" @click="submitRename">确定</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page {
  flex: 1;
  min-width: 0;
  height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  box-sizing: border-box;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

.proj {
  font-size: 13px;
  color: var(--text-2);
}

.stat {
  font-size: 12px;
  color: var(--text-4);
}

.actions {
  display: flex;
  gap: 8px;
}

.body {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 14px;
  min-height: 0;
}

.tree {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  overflow: auto;
  padding: 6px 0;
}

.row {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding-right: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-1);
}

.row:hover {
  background: #f5f7fa;
}

.row.on {
  background: #eaf2ff;
  color: #1d39c4;
  font-weight: 500;
}

.chev {
  transition: transform 0.12s;
  color: var(--text-3);
  flex: 0 0 auto;
}

.chev.open {
  transform: rotate(90deg);
}

.chev-space {
  width: 13px;
  flex: 0 0 13px;
}

.ico {
  color: var(--text-3);
  flex: 0 0 auto;
}

.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ops {
  display: none;
  gap: 2px;
}

.row:hover .ops {
  display: flex;
}

.op {
  border: 0;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.op:hover {
  background: #e6ebf2;
  color: var(--text-1);
}

.editor {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
}

.path {
  font-size: 12.5px;
  color: var(--text-2);
}

.kind {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f0f2f5;
  color: var(--text-3);
}

.dirty {
  font-size: 12px;
  color: #d46b08;
}

.spacer {
  flex: 1;
}

.code {
  flex: 1;
  border: 0;
  outline: none;
  resize: none;
  padding: 14px 16px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-4);
  font-size: 13px;
}

.err {
  color: #cf1322;
  font-size: 13px;
  margin-bottom: 8px;
}

.hint {
  font-size: 12px;
  color: var(--text-3);
  padding: 6px 12px;
}

.row-line {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.row-line > label {
  flex: 0 0 48px;
  padding-top: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.small {
  flex: 1;
  height: 150px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12.5px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  resize: vertical;
}
</style>
