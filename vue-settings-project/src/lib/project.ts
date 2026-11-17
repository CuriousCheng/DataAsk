import { reactive, watch } from 'vue'

export type FieldType = 'includes' | 'excludes' | 'custom'

export interface ProjectField {
  id: string
  type: FieldType
  name: string
  value: string
}

export interface Member {
  id: string
  name: string
  email: string
  initials: string
  orgRole: string
  role: '所有者' | '协作者' | '查看者'
}

export interface Group {
  id: string
  name: string
  members: number
  role: '所有者' | '协作者' | '查看者'
}

interface State {
  id: string
  name: string
  lang: string
  timezone: string
  description: string
  fields: ProjectField[]
  updatedAt: string
  members: Member[]
  groups: Group[]
  dataset: string
  embed: {
    name: string
    lang: string
    chatIcon: string
    logo: string
    sendColor: string
    loadingColor: string
    doneColor: string
    timelineColor: string
    limit: number
    type: 'public' | 'auth'
    publicOn: boolean
    authOn: boolean
    secret: string
  }
}

const KEY = 'dataask.settings.project.v1'

function seed(): State {
  return {
    id: '17535',
    name: 'Default Project',
    lang: '简体中文 - 简体中文',
    timezone: 'Asia/Shanghai (UTC+08:00)',
    description: '',
    fields: [],
    updatedAt: '',
    members: [
      {
        id: 'm-1',
        name: 'ahsx',
        email: 'ahsx@ahsx.freeqiye.com',
        initials: 'AH',
        orgRole: '管理员',
        role: '所有者',
      },
    ],
    groups: [],
    dataset: '人力资源',
    embed: {
      name: 'DataAsk',
      lang: '简体中文',
      chatIcon: '',
      logo: '',
      sendColor: '#2f54eb',
      loadingColor: '#2f54eb',
      doneColor: '#85a5ff',
      timelineColor: '#adc6ff',
      limit: 20,
      type: 'public',
      publicOn: false,
      authOn: false,
      secret: '',
    },
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    return { ...seed(), ...(JSON.parse(raw) as State) }
  } catch {
    return seed()
  }
}

export const project = reactive<State>(load())

watch(
  project,
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)

export const AI_LANGS = [
  'English - English',
  '简体中文 - 简体中文',
  '繁體中文 - 繁體中文',
  '日本語 - 日本語',
  '한국어 - 한국어',
  '意大利语 - Italiano',
  '韩语 - 한국어',
  '荷兰语 - Nederlands',
  '葡萄牙语 - Português',
  '俄语 - Русский',
  '土耳其语 - Türkçe',
]

export const TIMEZONES = [
  'Asia/Shanghai (UTC+08:00)',
  'Asia/Hong_Kong (UTC+08:00)',
  'Asia/Irkutsk (UTC+08:00)',
  'Asia/Kuala_Lumpur (UTC+08:00)',
  'Asia/Kuching (UTC+08:00)',
  'Asia/Macau (UTC+08:00)',
  'Asia/Makassar (UTC+08:00)',
  'Asia/Manila (UTC+08:00)',
  'Asia/Tokyo (UTC+09:00)',
]

export const DATASETS = [
  { key: '电子商务', icon: 'bag' },
  { key: '供应链', icon: 'gear' },
  { key: '信用卡交易', icon: 'card' },
  { key: '人力资源', icon: 'user' },
  { key: '酒店评分', icon: 'home' },
]
