import { computed, reactive, watch } from 'vue'

export interface Thread {
  id: string
  title: string
  question: string
  updatedAt: number
}

export type AccessMode = 'private' | 'project' | 'people'

export interface Workspace {
  id: string
  name: string
  kind: 'personal' | 'custom'
  access: AccessMode
  members: string[]
  groups: string[]
}

export interface Org {
  id: string
  code: number
  name: string
  timezone: string
}

export interface Project {
  id: string
  orgId: string
  name: string
  kind: 'agent' | 'classic'
}

interface State {
  workspaces: Workspace[]
  activeId: string
  threads: Record<string, Thread[]>
  collapsed: boolean
  orgs: Org[]
  activeOrgId: string
  projects: Project[]
  activeProjectId: string
}

const STORAGE_KEY = 'dataask.vue.workspace.v2'

export const DIRECTORY = {
  members: [{ id: 'm-1', name: 'ahsx', label: 'ahsx (me)', initials: 'AH' }],
  groups: [] as { id: string; name: string }[],
}

function seed(): State {
  const personalId = 'ws-personal'
  const orgId = 'org-1'
  return {
    workspaces: [
      { id: personalId, name: '个人文件夹', kind: 'personal', access: 'private', members: [], groups: [] },
    ],
    activeId: personalId,
    threads: {
      [personalId]: [
        {
          id: 'th-1',
          title: '按部门查看员工人数分布',
          question: '按部门查看员工人数分布',
          updatedAt: Date.now() - 1000 * 60 * 60 * 26,
        },
        {
          id: 'th-2',
          title: '各部门的平均在职时长',
          question: '各部门的平均在职时长',
          updatedAt: Date.now() - 1000 * 60 * 60 * 3,
        },
      ],
    },
    collapsed: false,
    orgs: [{ id: orgId, code: 11524, name: '示例科技有限公司', timezone: 'Etc/GMT-8' }],
    activeOrgId: orgId,
    projects: [
      { id: 'pj-1', orgId, name: 'Default Project', kind: 'agent' },
      { id: 'pj-2', orgId, name: '测试效果', kind: 'agent' },
      { id: 'pj-3', orgId, name: '测试', kind: 'classic' },
    ],
    activeProjectId: 'pj-1',
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as State
    if (!parsed?.workspaces?.length) return seed()
    return parsed
  } catch {
    return seed()
  }
}

const state = reactive<State>(load())

watch(
  state,
  (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {
      /* 忽略配额错误 */
    }
  },
  { deep: true },
)

export function useWorkspaces() {
  const activeWorkspace = computed(
    () => state.workspaces.find((w) => w.id === state.activeId) ?? state.workspaces[0],
  )

  const threads = computed<Thread[]>(() => state.threads[state.activeId] ?? [])

  const activeOrg = computed(() => state.orgs.find((o) => o.id === state.activeOrgId) ?? state.orgs[0])

  const orgProjects = computed(() => state.projects.filter((p) => p.orgId === state.activeOrgId))

  const activeProject = computed(
    () => state.projects.find((p) => p.id === state.activeProjectId) ?? orgProjects.value[0],
  )

  function setActive(id: string) {
    if (state.workspaces.some((w) => w.id === id)) {
      state.activeId = id
      return true
    }
    return false
  }

  function addWorkspace(name: string) {
    const id = `ws-${Date.now()}`
    state.workspaces.push({
      id,
      name: name.trim(),
      kind: 'custom',
      access: 'private',
      members: ['m-1'],
      groups: [],
    })
    state.threads[id] = []
    state.activeId = id
    return id
  }

  function renameWorkspace(id: string, name: string) {
    const ws = state.workspaces.find((w) => w.id === id)
    if (ws) ws.name = name.trim()
  }

  function removeWorkspace(id: string) {
    const idx = state.workspaces.findIndex((w) => w.id === id)
    if (idx < 0 || state.workspaces[idx].kind === 'personal') return false
    state.workspaces.splice(idx, 1)
    delete state.threads[id]
    if (state.activeId === id) state.activeId = state.workspaces[0].id
    return true
  }

  function setAccess(id: string, patch: Partial<Pick<Workspace, 'access' | 'members' | 'groups'>>) {
    const ws = state.workspaces.find((w) => w.id === id)
    if (ws) Object.assign(ws, patch)
  }

  function addThread(question: string) {
    const id = `th-${Date.now()}`
    const thread: Thread = { id, title: question, question, updatedAt: Date.now() }
    if (!state.threads[state.activeId]) state.threads[state.activeId] = []
    state.threads[state.activeId].unshift(thread)
    return thread
  }

  function findThread(id: string): Thread | undefined {
    for (const list of Object.values(state.threads)) {
      const hit = list.find((t) => t.id === id)
      if (hit) return hit
    }
    return undefined
  }

  function moveThread(threadId: string, toWorkspaceId: string) {
    for (const list of Object.values(state.threads)) {
      const idx = list.findIndex((t) => t.id === threadId)
      if (idx >= 0) {
        const [thread] = list.splice(idx, 1)
        if (!state.threads[toWorkspaceId]) state.threads[toWorkspaceId] = []
        state.threads[toWorkspaceId].unshift(thread)
        return true
      }
    }
    return false
  }

  function removeThread(threadId: string) {
    for (const list of Object.values(state.threads)) {
      const idx = list.findIndex((t) => t.id === threadId)
      if (idx >= 0) list.splice(idx, 1)
    }
  }

  function renameThread(threadId: string, title: string) {
    const t = findThread(threadId)
    if (t) t.title = title
  }

  /* ---------- 组织 ---------- */
  function addOrg(name: string, timezone: string) {
    const id = `org-${Date.now()}`
    state.orgs.push({ id, code: 10000 + Math.floor(Math.random() * 90000), name: name.trim(), timezone })
    state.activeOrgId = id
    return id
  }

  function removeOrg(id: string) {
    if (state.orgs.length <= 1) return false
    const idx = state.orgs.findIndex((o) => o.id === id)
    if (idx < 0) return false
    state.orgs.splice(idx, 1)
    state.projects = state.projects.filter((p) => p.orgId !== id)
    if (state.activeOrgId === id) state.activeOrgId = state.orgs[0].id
    return true
  }

  function setActiveOrg(id: string) {
    if (state.orgs.some((o) => o.id === id)) {
      state.activeOrgId = id
      const first = state.projects.find((p) => p.orgId === id)
      state.activeProjectId = first?.id ?? ''
      return true
    }
    return false
  }

  /* ---------- 项目 ---------- */
  function addProject(name: string, kind: 'agent' | 'classic') {
    const id = `pj-${Date.now()}`
    state.projects.push({ id, orgId: state.activeOrgId, name: name.trim(), kind })
    state.activeProjectId = id
    return id
  }

  function removeProject(id: string) {
    const idx = state.projects.findIndex((p) => p.id === id)
    if (idx < 0) return false
    state.projects.splice(idx, 1)
    if (state.activeProjectId === id) {
      state.activeProjectId = state.projects.find((p) => p.orgId === state.activeOrgId)?.id ?? ''
    }
    return true
  }

  function setActiveProject(id: string) {
    if (state.projects.some((p) => p.id === id)) {
      state.activeProjectId = id
      return true
    }
    return false
  }

  function toggleCollapsed() {
    state.collapsed = !state.collapsed
  }

  return {
    state,
    activeWorkspace,
    threads,
    activeOrg,
    orgProjects,
    activeProject,
    setActive,
    addWorkspace,
    renameWorkspace,
    removeWorkspace,
    setAccess,
    addThread,
    findThread,
    moveThread,
    removeThread,
    renameThread,
    addOrg,
    removeOrg,
    setActiveOrg,
    addProject,
    removeProject,
    setActiveProject,
    toggleCollapsed,
  }
}
