<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'
import Dropdown from './Dropdown.vue'
import { modeling, type Column, type Model } from '../lib/modeling'
import { showToast } from '../lib/toast'

const props = defineProps<{ open: boolean; mode: 'create' | 'update'; model?: Model | null }>()
const emit = defineEmits<{ close: [] }>()

const TABLES = ['employees', 'dept_emp', 'dept_manager', 'salaries', 'departments']
const SAMPLE_COLUMNS: Column[] = [
  { name: 'emp_no', alias: 'emp_no', type: 'INT64', description: 'Unique identifier for each employee' },
  { name: 'birth_date', alias: 'birth_date', type: 'DATE', description: 'Date of birth' },
  { name: 'first_name', alias: 'first_name', type: 'STRING', description: 'First name' },
  { name: 'last_name', alias: 'last_name', type: 'STRING', description: 'Last name' },
  { name: 'gender', alias: 'gender', type: 'STRING', description: 'Gender' },
  { name: 'hire_date', alias: 'hire_date', type: 'DATE', description: 'Date of hire' },
]

const table = ref('')
const available = ref<Column[]>([])
const selected = ref<Column[]>([])
const primary = ref('')
const leftQuery = ref('')
const rightQuery = ref('')
const checkedLeft = ref<string[]>([])

const title = computed(() => (props.mode === 'create' ? '创建数据模型' : props.model?.name ?? ''))

const leftRows = computed(() =>
  available.value.filter(
    (c) => !leftQuery.value || c.alias.toLowerCase().includes(leftQuery.value.toLowerCase()),
  ),
)

const rightRows = computed(() =>
  selected.value.filter(
    (c) => !rightQuery.value || c.alias.toLowerCase().includes(rightQuery.value.toLowerCase()),
  ),
)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    leftQuery.value = ''
    rightQuery.value = ''
    checkedLeft.value = []
    if (props.mode === 'update' && props.model) {
      table.value = props.model.name
      available.value = SAMPLE_COLUMNS.filter(
        (c) => !props.model!.columns.some((mc) => mc.alias === c.alias),
      )
      selected.value = props.model.columns.map((c) => ({ ...c }))
      primary.value = props.model.columns.find((c) => c.primary)?.alias ?? ''
    } else {
      table.value = ''
      available.value = SAMPLE_COLUMNS.map((c) => ({ ...c }))
      selected.value = []
      primary.value = ''
    }
  },
)

function pickTable(v: string) {
  table.value = v
  available.value = SAMPLE_COLUMNS.map((c) => ({ ...c }))
  selected.value = []
  primary.value = ''
}

function toggleCheck(alias: string) {
  checkedLeft.value = checkedLeft.value.includes(alias)
    ? checkedLeft.value.filter((a) => a !== alias)
    : [...checkedLeft.value, alias]
}

function moveRight() {
  const moving = available.value.filter((c) => checkedLeft.value.includes(c.alias))
  selected.value = [...selected.value, ...moving]
  available.value = available.value.filter((c) => !checkedLeft.value.includes(c.alias))
  checkedLeft.value = []
}

function moveLeft(alias: string) {
  const col = selected.value.find((c) => c.alias === alias)
  if (!col) return
  selected.value = selected.value.filter((c) => c.alias !== alias)
  available.value = [...available.value, col]
  if (primary.value === alias) primary.value = ''
}

function submit() {
  if (props.mode === 'create') {
    if (!table.value || !selected.value.length) {
      showToast('请选择表与列')
      return
    }
    modeling.models.push({
      name: table.value,
      alias: table.value,
      description: '',
      columns: selected.value.map((c) => ({ ...c, primary: c.alias === primary.value })),
      x: 60 + modeling.models.length * 40,
      y: 60 + modeling.models.length * 30,
      expanded: true,
    })
    showToast('模型已创建')
  } else if (props.model) {
    props.model.columns = selected.value.map((c) => ({ ...c, primary: c.alias === primary.value }))
    showToast('列已更新')
  }
  emit('close')
}
</script>

<template>
  <aside v-if="open" class="drawer">
    <header class="head">
      <button class="close" type="button" aria-label="关闭" @click="emit('close')">
        <X :size="16" />
      </button>
      <span class="title">{{ title }}</span>
    </header>

    <div class="body">
      <div class="field">
        <label><span class="req">*</span>选择表</label>
        <Dropdown
          :model-value="table"
          :options="TABLES.map((t) => ({ value: t, label: t }))"
          placeholder="选择表"
          @update:model-value="pickTable"
        />
      </div>

      <div class="field">
        <label><span class="req">*</span>选择列</label>
        <div class="transfer">
          <div class="panel">
            <div class="panel-head">
              <span>{{ leftRows.length }} 项</span>
              <span class="muted">可选列</span>
            </div>
            <div class="panel-search">
              <Search :size="13" />
              <input v-model="leftQuery" placeholder="请输入搜索内容" />
            </div>
            <div class="panel-table">
              <div class="row head">
                <span />
                <span>列名</span>
                <span>列类型</span>
              </div>
              <div v-for="c in leftRows" :key="c.alias" class="row" @click="toggleCheck(c.alias)">
                <input type="checkbox" :checked="checkedLeft.includes(c.alias)" @click.stop="toggleCheck(c.alias)" />
                <span>{{ c.alias }}</span>
                <span class="muted">{{ c.type }}</span>
              </div>
              <div v-if="!leftRows.length" class="empty">暂无数据</div>
            </div>
          </div>

          <div class="transfer-btns">
            <button class="btn btn-sm" type="button" :disabled="!checkedLeft.length" @click="moveRight">›</button>
          </div>

          <div class="panel">
            <div class="panel-head">
              <span>{{ rightRows.length }} 项</span>
              <span class="muted">已选列</span>
            </div>
            <div class="panel-search">
              <Search :size="13" />
              <input v-model="rightQuery" placeholder="请输入搜索内容" />
            </div>
            <div class="panel-table">
              <div class="row head">
                <span />
                <span>列名</span>
                <span>列类型</span>
              </div>
              <div v-for="c in rightRows" :key="c.alias" class="row">
                <input type="checkbox" />
                <span>{{ c.alias }}</span>
                <span class="muted">{{ c.type }}</span>
                <button class="rm" type="button" @click="moveLeft(c.alias)">×</button>
              </div>
              <div v-if="!rightRows.length" class="empty">暂无数据</div>
            </div>
          </div>
        </div>
      </div>

      <div class="field">
        <label>选择主键</label>
        <Dropdown
          :model-value="primary"
          :options="selected.map((c) => ({ value: c.alias, label: c.alias }))"
          placeholder="选择一个列"
          @update:model-value="(v) => (primary = v)"
        />
      </div>
    </div>

    <footer class="foot">
      <button class="btn" type="button" @click="emit('close')">取消</button>
      <button class="btn btn-primary" type="button" @click="submit">提交</button>
    </footer>
  </aside>
</template>

<style scoped>
.drawer {
  width: 760px;
  flex: 0 0 760px;
  height: 100%;
  background: #fff;
  border-left: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 18px;
  border-bottom: 1px solid var(--line);
}

.close {
  color: var(--text-2);
}

.title {
  font-size: 15px;
  font-weight: 600;
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px 30px;
}

.field {
  margin-bottom: 20px;
}

.field > label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text);
}

.req {
  color: var(--danger);
  margin-right: 2px;
}

.transfer {
  display: grid;
  grid-template-columns: 1fr 28px 1fr;
  gap: 8px;
  align-items: start;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--line);
}

.panel-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px;
  padding: 0 8px;
  height: 32px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  color: var(--text-3);
}

.panel-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
}

.panel-table {
  min-height: 260px;
  max-height: 300px;
  overflow-y: auto;
}

.row {
  display: grid;
  grid-template-columns: 24px 1fr 80px;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  font-size: 13px;
  border-bottom: 1px solid #f4f4f4;
  position: relative;
}

.row.head {
  color: var(--text-2);
  background: #fafafa;
  height: 36px;
}

.muted {
  color: var(--text-3);
  font-size: 12px;
}

.empty {
  padding: 70px 0;
  text-align: center;
  color: var(--text-4);
  font-size: 12px;
}

.transfer-btns {
  padding-top: 130px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rm {
  position: absolute;
  right: 6px;
  color: var(--text-3);
}

.foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--line);
}
</style>
