<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Box,
  Calendar,
  Check,
  ChevronDown,
  Hash,
  Info,
  Maximize,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Sparkles,
  Type,
} from 'lucide-vue-next'
import Sidebar from '../components/Sidebar.vue'
import NodeDrawer from '../components/NodeDrawer.vue'
import AddTableModal from '../components/AddTableModal.vue'
import CubeManagerModal from '../components/CubeManagerModal.vue'
import ViewModal, { type ProjectView } from '../components/ViewModal.vue'
import EditMetadataModal from '../components/EditMetadataModal.vue'
import Onboarding from '../components/Onboarding.vue'
import RelationModal from '../components/RelationModal.vue'
import { applyLayout, loadProject, modeling, projectName, relationsOf, type LayoutMode, type Model, type Relation } from '../lib/modeling'
import { buildProject, removeModel as apiRemoveModel } from '../lib/api'
import { http } from '@dataask/shared-ui'
import { showToast } from '../lib/toast'

const zoom = ref(100)
const selectedName = ref<string | null>(null)
const selectedColumn = ref<string | null>(null)
const nodeMenu = ref<string | null>(null)
const assistantOpen = ref(false)
const layoutOpen = ref(false)

const createOpen = ref(false)
const compiling = ref(false)
const cubeOpen = ref(false)
const views = ref<ProjectView[]>([])
const viewOpen = ref(false)
const editView = ref<ProjectView | null>(null)

const editOpen = ref(false)

const onboardingOpen = ref(false) // 首次引导不自动弹，需要时点右下角 ? 打开
const relationOpen = ref<Relation | null>(null)

async function loadViews() {
  try {
    const r = await http.get<{ items: ProjectView[] }>(
      '/api/projects/' + encodeURIComponent(projectName()) + '/views',
    )
    views.value = r.items || []
  } catch {
    views.value = []
  }
}

function openViewCreate() {
  editView.value = null
  viewOpen.value = true
}

function openViewEdit(v: ProjectView) {
  editView.value = v
  viewOpen.value = true
}

onMounted(() => {
  loadProject()
  loadViews()
})

const selected = computed<Model | null>(
  () => modeling.models.find((m) => m.name === selectedName.value) ?? null,
)

const LAYOUTS: LayoutMode[] = ['从左到右', '网格', '轨道']

const canvasW = computed(() => 1900)
const canvasH = computed(() => 1000)

function select(name: string, column?: string) {
  selectedName.value = name
  selectedColumn.value = column ?? null
  const m = modeling.models.find((x) => x.name === name)
  if (m) m.expanded = true
}

function closeDrawer() {
  selectedName.value = null
  selectedColumn.value = null
}

function setLayout(mode: LayoutMode) {
  applyLayout(mode)
  layoutOpen.value = false
}

async function removeModel(name: string) {
  if (!window.confirm('从业务里移除表 ' + name + ' ？会删除 models/' + name + '/metadata.yml')) return
  try {
    await apiRemoveModel(name)
    showToast('已移除 ' + name)
    await loadProject()
  } catch (e) {
    showToast(e instanceof Error ? e.message : '移除失败')
  }
  if (selectedName.value === name) selectedName.value = null
  nodeMenu.value = null
}

async function compile() {
  compiling.value = true
  try {
    const r = await buildProject()
    const first = (r.output || '').split('\n').find((l) => l.trim()) || ''
    showToast(r.ok ? '编译成功：' + first : '编译失败：' + first)
  } catch (e) {
    showToast(e instanceof Error ? e.message : '编译失败')
  } finally {
    compiling.value = false
  }
}

function openEdit() {
  editOpen.value = true
  nodeMenu.value = null
}

function openRelation(id: string) {
  relationOpen.value = modeling.relations.find((r) => r.id === id) ?? null
}

function closeOnboarding() {
  try {
    localStorage.setItem('dataask.modeling.onboarded', '1')
  } catch {
    /* ignore */
  }
  onboardingOpen.value = false
}

function typeIcon(type: string) {
  if (type === 'INT64') return Hash
  if (type === 'DATE') return Calendar
  return Type
}

function nodeWidth(m: Model) {
  return m.expanded ? 200 : 132
}

function anchors(from: Model, to: Model) {
  const fromRight = to.x >= from.x
  const toLeft = to.x >= from.x
  const x1 = from.x + (fromRight ? nodeWidth(from) : 0)
  const y1 = from.y + 18
  const x2 = to.x + (toLeft ? 0 : nodeWidth(to))
  const y2 = to.y + 18
  return { x1, y1, x2, y2 }
}

function edgePath(from: Model, to: Model) {
  const { x1, y1, x2, y2 } = anchors(from, to)
  const mid = (x1 + x2) / 2
  return `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`
}

function edgeLabelPos(from: Model, to: Model) {
  const { x1, y1, x2, y2 } = anchors(from, to)
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
}

const edges = computed(() =>
  modeling.relations
    .map((r) => {
      const from = modeling.models.find((m) => m.name === r.fromModel)
      const to = modeling.models.find((m) => m.name === r.toModel)
      if (!from || !to) return null
      return { id: r.id, label: r.fromColumn, d: edgePath(from, to), pos: edgeLabelPos(from, to) }
    })
    .filter(Boolean) as { id: string; label: string; d: string; pos: { x: number; y: number } }[],
)

function otherModel(modelName: string, relationId: string) {
  const r = modeling.relations.find((x) => x.id === relationId)
  if (!r) return ''
  return r.fromModel === modelName ? r.toModel : r.fromModel
}
</script>

<template>
  <div class="modeling">
    <Sidebar
      :views="views"
      @create="createOpen = true"
      @focus="select"
      @create-view="openViewCreate"
      @open-view="openViewEdit"
      @refresh-views="loadViews"
    />

    <div class="canvas-wrap">
      <div class="toolbar">
        <button class="assistant" type="button" @click="assistantOpen = !assistantOpen">
          <Sparkles :size="15" class="spark" />
          建模 AI 助理
          <ChevronDown :size="14" />
        </button>
        <button class="assistant" type="button" @click="cubeOpen = true">指标</button>
        <button class="assistant" type="button" :disabled="compiling" @click="compile">
          {{ compiling ? '编译中…' : '编译' }}
        </button>
        <div v-if="assistantOpen" class="pop assistant-pop" @mouseleave="assistantOpen = false">
          <button class="pop-item" type="button" @click="showToast('生成语义还没接后端')">生成语义</button>
          <button class="pop-item" type="button" @click="showToast('生成关联还没接后端')">生成关联</button>
        </div>
      </div>

      <div class="canvas-scroll">
        <div class="canvas" :style="{ width: canvasW + 'px', height: canvasH + 'px', transform: `scale(${zoom / 100})` }">
          <svg class="edges" :width="canvasW" :height="canvasH">
            <g v-for="e in edges" :key="e.id">
              <path :d="e.d" fill="none" stroke="#b8b8b8" stroke-width="1.2" stroke-dasharray="4 3" />
              <path
                :d="e.d"
                fill="none"
                stroke="transparent"
                stroke-width="14"
                style="pointer-events: stroke; cursor: pointer"
                @click="openRelation(e.id)"
              />
              <g :transform="`translate(${e.pos.x}, ${e.pos.y})`">
                <rect x="-26" y="-9" width="52" height="18" rx="9" fill="#fff" stroke="#dcdcdc" />
                <text x="0" y="4" text-anchor="middle" font-size="10" fill="#8c8c8c">{{ e.label }}</text>
              </g>
            </g>
          </svg>

          <div
            v-for="m in modeling.models"
            :key="m.name"
            class="node"
            :data-selected="selectedName === m.name"
            :style="{ left: m.x + 'px', top: m.y + 'px', width: nodeWidth(m) + 'px' }"
            @click="select(m.name)"
          >
            <div class="node-head">
              <Box :size="13" />
              <span class="node-name">{{ m.name }}</span>
              <button class="dots" type="button" aria-label="更多" @click.stop="nodeMenu = nodeMenu === m.name ? null : m.name">
                <MoreHorizontal :size="14" />
              </button>
            </div>

            <div v-if="m.expanded" class="node-body">
              <div class="node-sub">列 ({{ m.columns.length }})</div>
              <div
                v-for="c in m.columns"
                :key="c.name"
                class="node-col"
                :data-active="selectedName === m.name && selectedColumn === c.alias"
                @click.stop="select(m.name, c.alias)"
              >
                <component :is="typeIcon(c.type)" :size="12" class="ci" />
                <span class="ellipsis">{{ c.alias || c.name }}</span>
              </div>

              <div class="node-row">
                <span>计算字段 (0)</span>
                <button class="mini" type="button" @click.stop="showToast('计算字段还没做')">+</button>
              </div>
              <div class="node-row">
                <span>关系 ({{ relationsOf(m.name).length }})</span>
                <button class="mini" type="button" @click.stop="showToast('关系编辑还没做')">+</button>
              </div>
              <div v-for="r in relationsOf(m.name)" :key="r.id" class="node-col rel">
                <Box :size="12" class="ci" />
                <span class="ellipsis">{{ otherModel(m.name, r.id) }}</span>
                <button class="dots small" type="button" @click.stop="showToast('关系菜单还没做')">
                  <MoreHorizontal :size="12" />
                </button>
              </div>
            </div>

            <div v-if="nodeMenu === m.name" class="pop node-menu" @mouseleave="nodeMenu = null">
              <button class="pop-item" type="button" @click="openEdit">更新列</button>
              <button class="pop-item" type="button" @click="openEdit">编辑元数据</button>
              <button class="pop-item danger" type="button" @click="removeModel(m.name)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div class="zoom">
        <button class="zbtn" type="button" aria-label="放大" @click="zoom = Math.min(200, zoom + 10)">
          <Plus :size="14" />
        </button>
        <button class="zbtn" type="button" aria-label="缩小" @click="zoom = Math.max(30, zoom - 10)">
          <Minus :size="14" />
        </button>
        <button class="zbtn" type="button" aria-label="适应屏幕" title="适应屏幕" @click="zoom = 100">
          <Maximize :size="14" />
        </button>
      </div>

      <div class="bottom-bar">
        <button class="icon-btn" type="button" aria-label="重置布局" title="重置布局" @click="setLayout(modeling.layout)">
          <RefreshCw :size="14" />
        </button>
        <span class="pct">{{ zoom }}%</span>
        <div class="layout-wrap">
          <button class="layout-btn" type="button" @click="layoutOpen = !layoutOpen">
            {{ modeling.layout }}
            <ChevronDown :size="13" />
          </button>
          <div v-if="layoutOpen" class="pop layout-pop" @mouseleave="layoutOpen = false">
            <button
              v-for="l in LAYOUTS"
              :key="l"
              class="pop-item"
              type="button"
              :data-active="modeling.layout === l"
              @click="setLayout(l)"
            >
              {{ l }}
              <Check v-if="modeling.layout === l" :size="13" class="check" />
            </button>
          </div>
        </div>
        <button class="icon-btn" type="button" aria-label="建模指南" @click="onboardingOpen = true">
          <Info :size="14" />
        </button>
      </div>
    </div>

    <NodeDrawer
      v-if="selected"
      :model="selected"
      :highlight="selectedColumn"
      @close="closeDrawer"
      @edit="editOpen = true"
      @edit-relation="relationOpen = $event"
    />
    <RelationModal :open="!!relationOpen" :relation="relationOpen" @close="relationOpen = null" />
    <AddTableModal :open="createOpen" @close="createOpen = false" />
    <CubeManagerModal :open="cubeOpen" @close="cubeOpen = false" @saved="loadProject()" />
    <ViewModal :open="viewOpen" :view="editView" @close="viewOpen = false" @saved="loadViews" />
    <EditMetadataModal :open="editOpen" :model="selected" @close="editOpen = false" />
    <Onboarding :open="onboardingOpen" @close="closeOnboarding" />
  </div>
</template>

<style scoped>
.modeling {
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.canvas-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff radial-gradient(#e6e6e6 1px, transparent 1px);
  background-size: 18px 18px;
}

.toolbar {
  position: absolute;
  top: 14px;
  left: 16px;
  z-index: 10;
}

.assistant {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.spark {
  color: #2f54eb;
}

.assistant-pop {
  top: 50px;
  left: 0;
  min-width: 190px;
}

.canvas-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 70px 0 0 30px;
}

.canvas {
  position: relative;
  transform-origin: 0 0;
}

.edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.node {
  position: absolute;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e2e2;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: visible;
  cursor: pointer;
}

.node[data-selected='true'] {
  border-color: #2f54eb;
  box-shadow: 0 0 0 1px #2f54eb;
}

.node-head {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 8px 0 10px;
  border-radius: 7px 7px 0 0;
  background: #2f54eb;
  color: #fff;
  font-size: 13px;
}

.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dots {
  display: inline-flex;
  color: rgba(255, 255, 255, 0.85);
}

.dots.small {
  color: var(--text-3);
}

.node-body {
  padding: 6px 0 8px;
}

.node-sub {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-3);
}

.node-col {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--text);
}

.node-col[data-active='true'] {
  background: #eef3ff;
  color: #2f54eb;
}

.node-col.rel {
  color: var(--text-2);
}

.ci {
  color: var(--text-4);
  flex: 0 0 auto;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--text-3);
}

.mini {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: var(--text-3);
}

.mini:hover {
  background: #f0f0f0;
}

.node-menu {
  top: 34px;
  right: 4px;
  min-width: 150px;
  z-index: 20;
}

.node-menu .danger {
  color: #cf1322;
}

.zoom {
  position: absolute;
  left: 16px;
  bottom: 60px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zbtn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--text-2);
}

.zbtn:hover {
  background: #f5f5f5;
}

.bottom-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px;
  border-top: 1px solid var(--line);
  background: #fff;
}

.pct {
  font-size: 12px;
  color: var(--text-2);
  min-width: 40px;
}

.layout-wrap {
  position: relative;
}

.layout-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font-size: 12px;
}

.layout-pop {
  bottom: 34px;
  left: 0;
  min-width: 140px;
}

.check {
  margin-left: auto;
  color: #2f54eb;
}
</style>
