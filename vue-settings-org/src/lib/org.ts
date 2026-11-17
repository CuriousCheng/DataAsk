import { reactive, watch } from 'vue'

export interface Member {
  id: string
  name: string
  email: string
  initials: string
  role: '管理员' | '成员'
  me?: boolean
}

export interface Group {
  id: string
  name: string
  members: number
}

export interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsedAt: string
  creator: string
}

export interface LogStep {
  text: string
}

export interface ActivityLog {
  id: string
  timestamp: string
  user: string
  email: string
  project: string
  projectId?: string
  threadId?: string
  threadName?: string
  question: string
  type: 'Embedded thread' | 'Auth' | 'Thread' | 'Agent'
  action: string
  status: 'Success' | 'Failed'
  mode?: string
  sql?: string
  answer?: string
  chart?: string
  tokensIn?: number
  tokensCached?: number
  tokensOut?: number
  points?: number
  duration?: number
  steps?: LogStep[]
}

export interface ProjectRow {
  id: string
  name: string
  source: string
  open: boolean
}

interface State {
  id: string
  name: string
  members: Member[]
  groups: Group[]
  apiKeys: ApiKey[]
  logs: ActivityLog[]
  mcp: {
    enabled: boolean
    endpoint: string
    defaultOpen: boolean
    projects: ProjectRow[]
  }
}

const KEY = 'dataask.settings.org.v1'

const SQL_1 = `WITH
valid_orders AS (
  SELECT
    o.order_id,
    o.customer_id
  FROM
    \`olist_orders_dataset\` AS o
  WHERE
    o.order_status NOT IN ('canceled', 'unavailable')
),
payments_by_state AS (
  SELECT
    c.customer_state AS customer_state,
    SUM(p.payment_value) AS total_payment
  FROM
    payments_by_state p
  JOIN valid_orders v ON v.order_id = p.order_id
  GROUP BY 1
)
SELECT customer_state, total_payment
FROM payments_by_state
ORDER BY total_payment DESC;`

const ANSWER_1 = `本次统计使用了三类信息：**订单信息**（只保留正常完成、未取消/不可用的订单）、**顾客信息**（用于识别顾客所在州）、以及**订单支付信息**（汇总每笔支付金额），从而计算“各州顾客支付的总金额”。各州顾客支付总金额（按金额从高到低）如下（单位：金额）：

| 州 | 支付总金额 |
|---|---|
| SP | 5,878,935.99 |
| RJ | 2,115,994.28 |
| MG | 1,843,460.37 |
| RS | 877,803.80 |
| PR | 794,653.20 |
| SC | 608,180.51 |
| BA | 607,041.45 |
| DF | 351,487.63 |
| GO | 340,626.24 |
| ES | 323,105.75 |
| PE | 321,120.88 |
| CE | 274,549.81 |
| PA | 217,484.52 |
| MT | 186,222.41 |
| MA | 150,691.70 |
| PB | 140,519.57 |
| MS | 135,929.68 |
| PI | 107,859.45 |
| RN | 101,908.60 |
| AL | 96,252.70 |
| SE | 73,032.32 |
| TO | 61,103.85 |
| RO | 57,433.47 |
| AM | 27,846.44 |
| AC | 19,680.62 |
| AP | 16,262.80 |
| RR | 9,948.97 |`

const CHART_1 = `{
  "title": {
    "left": "center",
    "text": "各州顾客支付总金额"
  },
  "xAxis": {
    "name": "支付总金额",
    "type": "value"
  },
  "yAxis": {
    "name": "州",
    "type": "category"
  },
  "series": [
    {
      "type": "bar",
      "data": [5878935.99, 2115994.28, 1843460.37]
    }
  ]
}`

const ANSWER_2 = `Development 部门的员工数量最多，女性 34,258 人、男性 51,449 人；Finance 部门最少，女性 7,015 人、男性 10,331 人。

如需进一步分析，可以继续查看：
- 各部门男女员工比例
- 各性别员工在不同部门的占比
- 仅统计当前仍在职的员工（按 to_date 定义）`

const STEPS: LogStep[] = [
  { text: 'Preparing to analyze data' },
  { text: '已执行工具 Skill' },
  { text: 'Executing instructions' },
  { text: '已读取 7 个文件' },
  { text: 'Executing the query' },
  { text: '已执行 1 个命令 with view data' },
  { text: 'Preparing a chart rendering' },
  { text: '已读取 SKILLmd' },
  { text: 'Preparing data for rendering' },
  { text: '已执行工具 Render chart' },
]

function seed(): State {
  return {
    id: '11524',
    name: '示例科技有限公司',
    members: [
      {
        id: 'm-1',
        name: 'ahsx',
        email: 'ahsx@ahsx.freeqiye.com',
        initials: 'AH',
        role: '管理员',
        me: true,
      },
    ],
    groups: [],
    apiKeys: [],
    logs: [
      {
        id: '112178',
        timestamp: '2026-11-16 00:28:47',
        user: 'ahsx',
        email: 'ahsx@ahsx.freeqiye.com',
        project: 'Default Project',
        question: '',
        type: 'Embedded thread',
        action: 'Generate shared secret key',
        status: 'Success',
      },
      {
        id: '112150',
        timestamp: '2026-11-15 23:53:13',
        user: 'ahsx',
        email: 'ahsx@ahsx.freeqiye.com',
        project: '',
        question: '',
        type: 'Auth',
        action: 'Login',
        status: 'Success',
      },
      {
        id: '112071',
        timestamp: '2026-11-13 16:00:20',
        user: 'ahsx',
        email: 'ahsx@ahsx.freeqiye.com',
        project: '测试',
        projectId: '17537',
        threadId: '37274',
        threadName: '各州顾客支付的总金额是多少？',
        question: '各州顾客支付的总金额是多少？',
        type: 'Thread',
        action: 'Create',
        status: 'Success',
        mode: 'Interactive',
        sql: SQL_1,
        answer: ANSWER_1,
        chart: CHART_1,
        tokensIn: 56469,
        tokensOut: 1573,
        points: 1.3,
        duration: 25.325,
      },
      {
        id: '112020',
        timestamp: '2026-11-13 14:35:28',
        user: 'ahsx',
        email: 'ahsx@ahsx.freeqiye.com',
        project: '',
        question: '',
        type: 'Auth',
        action: 'Login',
        status: 'Success',
      },
      {
        id: '111998',
        timestamp: '2026-11-13 13:33:33',
        user: 'ahsx',
        email: 'ahsx@ahsx.freeqiye.com',
        project: 'Default Project',
        projectId: '17535',
        threadId: '37253',
        threadName: '按部门与性别划分的员工总数是多少？',
        question: '按部门与性别划分的员工总数是多少？',
        type: 'Agent',
        action: 'Create',
        status: 'Success',
        mode: 'Agent',
        answer: ANSWER_2,
        tokensIn: 21584,
        tokensCached: 252398,
        tokensOut: 1423,
        points: 0.2,
        duration: 42.101,
        steps: STEPS,
      },
      {
        id: '111997',
        timestamp: '2026-11-13 13:33:32',
        user: 'ahsx',
        email: 'ahsx@ahsx.freeqiye.com',
        project: 'Default Project',
        projectId: '17535',
        threadId: '37252',
        threadName: '按部门与性别划分的员工总数是多少？',
        question: '按部门与性别划分的员工总数是多少？',
        type: 'Thread',
        action: 'Create',
        status: 'Success',
        mode: 'Interactive',
        answer: ANSWER_2,
        tokensIn: 55278,
        tokensCached: 218929,
        tokensOut: 1592,
        points: 0.3,
        duration: 18.402,
      },
    ],
    mcp: {
      enabled: true,
      endpoint: 'https://cloud.getwren.ai/api/mcp',
      defaultOpen: false,
      projects: [
        { id: 'pj-1', name: 'Default Project', source: 'BIG_QUERY', open: false },
        { id: 'pj-2', name: '测试效果', source: 'BIG_QUERY', open: false },
        { id: 'pj-3', name: '测试', source: 'BIG_QUERY', open: false },
      ],
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

export const org = reactive<State>(load())

watch(
  org,
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)

export const PROJECTS = ['Default Project', '测试效果', '测试']
export const PROJECT_ROLES = ['所有者', '协作者', '查看者']
