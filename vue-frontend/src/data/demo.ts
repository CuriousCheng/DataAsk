export interface RegionRow {
  region: string
  newCustomer: number
  returning: number
}

/** 演示数据：不是真实业务数据，只用于演示表格与图表的呈现方式 */
export const REGION_ROWS: RegionRow[] = [
  { region: '华东', newCustomer: 12840, returning: 21460 },
  { region: '华北', newCustomer: 9310, returning: 15420 },
  { region: '华南', newCustomer: 11070, returning: 18230 },
  { region: '西南', newCustomer: 6180, returning: 9740 },
  { region: '西北', newCustomer: 3260, returning: 5410 },
  { region: '东北', newCustomer: 4720, returning: 7980 },
]

export const DEMO_ANSWER = {
  intro: '我会先按区域汇总新老客户的订单数，再补一张对比图，方便看各区域的客户结构。',
  lead: '各区域的新客与老客订单数如下（演示数据，按区域聚合并去重）：',
  tableNote:
    '华东与华南的新客、老客订单数都明显高于其它区域；西北体量最小，但老客占比并不低。',
  chartTitle: '各区域新老客户订单数',
  chartNote: '分组柱状图比较各区域的新客与老客订单数；华东两项均最高，西北均最低。',
  conclusion: '华东的区域体量最大，新客 12,840、老客 21,460；西北最小，新客 3,260、老客 5,410。',
  followUps: ['各区域新客占比', '老客复购率按月变化', '只统计最近 30 天的订单'],
}

export const THINKING_STEPS = [
  '已读取数据表：orders（6 个字段）',
  '已执行查询：按 region 分组聚合',
  '已执行工具：渲染图表',
]
