import { reactive, watch } from 'vue'

export interface Skill {
  name: string
  desc: string
  builtin: boolean
}

export interface Memory {
  id: string
  text: string
}

interface State {
  profile: {
    firstName: string
    lastName: string
    email: string
  }
  skills: Skill[]
  memories: Memory[]
}

const KEY = 'dataask.settings.user.v2'

const SKILLS: Skill[] = [
  {
    name: 'analyze-data',
    builtin: true,
    desc: 'Use this skill when the user asks to query data, get specific numbers, answer factual questions, analyze data, find trends, explore a dataset, or visualize results.',
  },
  {
    name: 'data-export',
    builtin: true,
    desc: 'Use when the user wants data as a downloadable file — CSV, Excel/xlsx, a spreadsheet of the rows, "export this table", "give me the list as Excel". The rows come from SQL through `export_query`. Not for a report (generate-report, which exports to Word/PDF/PowerPoint), and not for reading or editing a file the user…',
  },
  {
    name: 'genbi-app',
    builtin: true,
    desc: 'Builds data apps — anything that lives in a sandboxed iframe and shows data: interactive dashboards (React + ECharts + RGL + cube-sdk), static reports (single-page React with a hardcoded snapshot), or custom presentations (games, narrative, simulations, anything else bound only by the iframe contract). Use when the…',
  },
  {
    name: 'generate-report',
    builtin: true,
    desc: 'Use this skill when the user asks for a report, summary, write-up, one-pager, memo, briefing, recap, or executive readout of their data — anything multi-section they would keep, share, or come back to. The deliverable is an HTML report page, and this skill is also the only way to a Word, PDF or PowerPoint report or deck …',
  },
  {
    name: 'uploaded-files',
    builtin: true,
    desc: 'Use when the user uploads or references a file — PDF, Word (.docx/.doc/.dotx), Excel/CSV (.xlsx/.xls/.csv), PowerPoint (.pptx/.potx) — and wants it read, summarised, queried, compared with project data, or edited. Not for producing a new report from project data (generate-report) or exporting query results as…',
  },
]

function seed(): State {
  return {
    profile: {
      firstName: 'admin',
      lastName: '',
      email: '',
    },
    skills: SKILLS,
    memories: [],
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

export const user = reactive<State>(load())

watch(
  user,
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  },
  { deep: true },
)
