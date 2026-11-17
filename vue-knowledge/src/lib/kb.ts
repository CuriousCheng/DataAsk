import { reactive } from 'vue'
import { http } from '@dataask/shared-ui'

export interface FileItem {
  path: string
  size: number
}

interface State {
  project: string
  dirs: string[]
  files: FileItem[]
  active: string
  content: string
  dirty: boolean
  loading: boolean
  saving: boolean
  error: string
  collapsed: Record<string, boolean>
}

export const kb = reactive<State>({
  project: '',
  dirs: [],
  files: [],
  active: '',
  content: '',
  dirty: false,
  loading: false,
  saving: false,
  error: '',
  collapsed: {},
})

const HIDDEN = ['.wren', 'target', '.git', '__pycache__']

export function projectName(): string {
  try {
    return localStorage.getItem('dataask.project') || '汽车销售分析'
  } catch {
    return '汽车销售分析'
  }
}

function visible(p: string) {
  return !HIDDEN.some((h) => p === h || p.startsWith(h + '/'))
}

export function base(): string {
  return '/api/projects/' + encodeURIComponent(kb.project)
}

export async function loadTree(project = projectName()) {
  kb.loading = true
  kb.error = ''
  kb.project = project
  try {
    const res = await http.get<{ items: FileItem[]; dirs?: string[] }>(base() + '/files')
    kb.files = (res.items || []).filter((f) => visible(f.path))
    kb.dirs = (res.dirs || []).filter(visible)
  } catch (e) {
    kb.error = e instanceof Error ? e.message : '加载失败'
  } finally {
    kb.loading = false
  }
}

export async function openFile(path: string) {
  if (kb.dirty && !window.confirm('当前文件有未保存修改，放弃？')) return
  kb.active = path
  kb.error = ''
  try {
    const res = await http.get<{ ok: boolean; exists?: boolean; text: string }>(
      base() + '/file?path=' + encodeURIComponent(path),
    )
    kb.content = res.text || ''
    kb.dirty = false
  } catch (e) {
    kb.error = e instanceof Error ? e.message : '读取失败'
    kb.content = ''
  }
}

export async function saveFile(path = kb.active, text = kb.content) {
  if (!path) return
  kb.saving = true
  try {
    await http.put(base() + '/file', { path, text })
    kb.dirty = false
    await loadTree()
    if (kb.active === path) kb.content = text
  } catch (e) {
    kb.error = e instanceof Error ? e.message : '保存失败'
    throw e
  } finally {
    kb.saving = false
  }
}

export async function createFile(path: string, text = '') {
  await http.put(base() + '/file', { path, text })
  await loadTree()
  kb.active = path
  kb.content = text
  kb.dirty = false
}

export async function createFolder(path: string) {
  await http.post(base() + '/mkdir', { path })
  await loadTree()
  const parent = path.split('/').slice(0, -1).join('/')
  if (parent) kb.collapsed[parent] = false
}

export async function deleteFile(path: string) {
  await http.del(base() + '/file?path=' + encodeURIComponent(path))
  if (kb.active === path) {
    kb.active = ''
    kb.content = ''
    kb.dirty = false
  }
  await loadTree()
}

export async function deleteFolder(path: string) {
  await http.del(base() + '/folder?path=' + encodeURIComponent(path))
  if (kb.active.startsWith(path + '/')) {
    kb.active = ''
    kb.content = ''
    kb.dirty = false
  }
  await loadTree()
}

export async function renameFile(oldPath: string, newPath: string) {
  const res = await http.get<{ text: string }>(base() + '/file?path=' + encodeURIComponent(oldPath))
  await http.put(base() + '/file', { path: newPath, text: res.text || '' })
  await http.del(base() + '/file?path=' + encodeURIComponent(oldPath))
  await loadTree()
  if (kb.active === oldPath) kb.active = newPath
}

export interface TreeNode {
  name: string
  path: string
  dir: boolean
  children: TreeNode[]
  size?: number
}

export function buildTree(): TreeNode[] {
  const root: TreeNode = { name: '', path: '', dir: true, children: [] }

  const ensureDir = (path: string) => {
    const parts = path.split('/')
    let node = root
    let acc = ''
    parts.forEach((part) => {
      acc = acc ? acc + '/' + part : part
      let child = node.children.find((c) => c.name === part && c.dir)
      if (!child) {
        child = { name: part, path: acc, dir: true, children: [] }
        node.children.push(child)
      }
      node = child
    })
  }

  kb.dirs.forEach(ensureDir)

  kb.files.forEach((f) => {
    const parts = f.path.split('/')
    const fileName = parts.pop() as string
    let node = root
    let acc = ''
    parts.forEach((part) => {
      acc = acc ? acc + '/' + part : part
      let child = node.children.find((c) => c.name === part && c.dir)
      if (!child) {
        child = { name: part, path: acc, dir: true, children: [] }
        node.children.push(child)
      }
      node = child
    })
    node.children.push({ name: fileName, path: f.path, dir: false, children: [], size: f.size })
  })

  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1))
    nodes.forEach((n) => sort(n.children))
  }
  sort(root.children)
  return root.children
}

export function toggle(path: string) {
  kb.collapsed[path] = !kb.collapsed[path]
}

export function isCollapsed(path: string) {
  return kb.collapsed[path] ?? false
}

export function fileKind(path: string) {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  if (ext === 'yml' || ext === 'yaml') return 'YAML'
  if (ext === 'md') return 'Markdown'
  if (ext === 'json') return 'JSON'
  return ext.toUpperCase()
}

export interface Template {
  key: string
  label: string
  path: string
  body: string
}

export const TEMPLATES: Template[] = [
  {
    key: 'rule',
    label: '业务规则 knowledge/rules',
    path: 'knowledge/rules/new-rule.md',
    body: '---\ntype: instruction\nname: ""\napply_when: always\n---\n\n# 规则\n\n## 适用场景\n\n## 规则内容\n',
  },
  {
    key: 'metric',
    label: '指标定义 knowledge/metrics',
    path: 'knowledge/metrics/new-metric.md',
    body: '---\ntype: metric\nname: ""\n---\n\n# 指标\n\n## 定义\n\n## 计算方式\n',
  },
  {
    key: 'glossary',
    label: '术语 knowledge/glossary',
    path: 'knowledge/glossary/new-term.md',
    body: '---\ntype: glossary\nterm: ""\n---\n\n# 术语\n\n## 含义\n\n## 相关字段\n',
  },
  {
    key: 'memory',
    label: '记忆 / SQL 配对 knowledge/sql',
    path: 'knowledge/sql/new-pair.md',
    body: '---\ntype: sql_pair\nquestion: ""\n---\n\n# 问题\n\n## SQL\n\n```sql\nSELECT 1;\n```\n',
  },
  {
    key: 'yaml',
    label: 'YAML 文件',
    path: 'knowledge/new.yml',
    body: '',
  },
]
