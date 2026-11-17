<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Plus, Trash2, X } from 'lucide-vue-next'
import { showToast } from '../lib/toast'
import { modeling } from '../lib/modeling'
import {
  createCube,
  deleteCube,
  getCubeJson,
  listCubeItems,
  putCubeJson,
  type CubeField,
  type CubeItem,
  type CubeJson,
} from '../lib/api'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const cubes = ref<CubeItem[]>([])
const loading = ref(false)
const error = ref('')
const busy = ref(false)

const isNew = ref(false)
const form = ref<CubeJson>(blank())

function blank(): CubeJson {
  return {
    name: '',
    base_object: '',
    measures: [{ name: '', expression: '', type: 'BIGINT' }],
    dimensions: [],
    time_dimensions: [],
    properties: { description: '' },
  }
}

const models = computed(() => modeling.models.map((m) => m.name))
const description = computed({
  get: () => String(form.value.properties?.description ?? ''),
  set: (v: string) => {
    form.value.properties = { ...(form.value.properties || {}), description: v }
  },
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    cubes.value = await listCubeItems()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    isNew.value = false
    form.value = blank()
    await load()
  },
  { immediate: true },
)

async function openCube(name: string) {
  try {
    form.value = await getCubeJson(name)
    isNew.value = false
    error.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : '读取失败'
  }
}

function startNew() {
  isNew.value = true
  form.value = blank()
  if (models.value.length) form.value.base_object = models.value[0]
  error.value = ''
}

function addField(kind: 'measures' | 'dimensions' | 'time_dimensions') {
  form.value[kind].push({ name: '', expression: '', type: kind === 'measures' ? 'BIGINT' : 'VARCHAR' })
}

function removeField(kind: 'measures' | 'dimensions' | 'time_dimensions', i: number) {
  form.value[kind].splice(i, 1)
}

async function save() {
  if (!form.value.name.trim()) {
    showToast('先填指标名')
    return
  }
  busy.value = true
  error.value = ''
  try {
    if (isNew.value) {
      await createCube(form.value)
      showToast('指标已创建')
      isNew.value = false
    } else {
      await putCubeJson(form.value.name, form.value)
      showToast('指标已保存')
    }
    await load()
    emit('saved')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!form.value.name) return
  if (!window.confirm('删除指标 ' + form.value.name + ' ？')) return
  try {
    await deleteCube(form.value.name)
    showToast('已删除')
    form.value = blank()
    await load()
    emit('saved')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '删除失败')
  }
}

const fields = (k: 'measures' | 'dimensions' | 'time_dimensions'): CubeField[] => form.value[k]
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal cube-modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">指标</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="body">
        <aside class="list">
          <button class="new-btn" type="button" @click="startNew">
            <Plus :size="13" />
            新建指标
          </button>
          <p v-if="loading" class="hint">加载中…</p>
          <button
            v-for="c in cubes"
            :key="c.name"
            class="item"
            type="button"
            :data-active="!isNew && c.name === form.name"
            @click="openCube(c.name)"
          >
            <span class="item-name">{{ c.name }}</span>
            <span class="item-meta">{{ c.base_object }}</span>
          </button>
          <p v-if="!loading && !cubes.length" class="hint">还没有指标</p>
        </aside>

        <section class="form">
          <div class="row2">
            <div class="field">
              <div class="k">名称（英文，同时是目录名）</div>
              <input v-model="form.name" class="input" :disabled="!isNew" placeholder="sales_model" />
            </div>
            <div class="field">
              <div class="k">基础模型</div>
              <select v-model="form.base_object" class="input">
                <option value="">（选一个模型）</option>
                <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
          </div>

          <div class="field">
            <div class="k">说明</div>
            <input v-model="description" class="input" placeholder="按品牌车型统计销量与金额" />
          </div>

          <div class="group">
            <div class="group-head">
              <span>度量 measures（数值，SUM/COUNT/AVG…）</span>
              <button class="add" type="button" @click="addField('measures')">
                <Plus :size="12" />
                加一条
              </button>
            </div>
            <div v-for="(f, i) in fields('measures')" :key="'m' + i" class="frow">
              <input v-model="f.name" class="input" placeholder="item_count" />
              <input v-model="f.expression" class="input grow" placeholder="COUNT(*)" />
              <input v-model="f.type" class="input tiny" placeholder="BIGINT" />
              <button class="icon-btn" type="button" aria-label="删除" @click="removeField('measures', i)">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>

          <div class="group">
            <div class="group-head">
              <span>维度 dimensions（分组用的字段）</span>
              <button class="add" type="button" @click="addField('dimensions')">
                <Plus :size="12" />
                加一条
              </button>
            </div>
            <div v-for="(f, i) in fields('dimensions')" :key="'d' + i" class="frow">
              <input v-model="f.name" class="input" placeholder="brand" />
              <input v-model="f.expression" class="input grow" placeholder="brand" />
              <input v-model="f.type" class="input tiny" placeholder="VARCHAR" />
              <button class="icon-btn" type="button" aria-label="删除" @click="removeField('dimensions', i)">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>

          <div class="group">
            <div class="group-head">
              <span>时间维度 time_dimensions</span>
              <button class="add" type="button" @click="addField('time_dimensions')">
                <Plus :size="12" />
                加一条
              </button>
            </div>
            <div v-for="(f, i) in fields('time_dimensions')" :key="'t' + i" class="frow">
              <input v-model="f.name" class="input" placeholder="order_date" />
              <input v-model="f.expression" class="input grow" placeholder="order_date" />
              <input v-model="f.type" class="input tiny" placeholder="DATE" />
              <button class="icon-btn" type="button" aria-label="删除" @click="removeField('time_dimensions', i)">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>

          <p v-if="error" class="err">{{ error }}</p>
        </section>
      </div>

      <div class="modal-foot">
        <button class="btn danger" type="button" :disabled="isNew || !form.name" @click="remove">
          删除
        </button>
        <span class="spacer" />
        <button class="btn" type="button" @click="emit('close')">关闭</button>
        <button class="btn btn-primary" type="button" :disabled="busy" @click="save">
          {{ busy ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cube-modal {
  width: 980px;
  max-height: 86vh;
}

.body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.list {
  border-right: 1px solid var(--line);
  padding-right: 10px;
  overflow: auto;
}

.new-btn,
.add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  color: var(--text-2);
}

.item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 7px 8px;
  margin-top: 4px;
  border-radius: 6px;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.item:hover {
  background: #f5f7fa;
}

.item[data-active='true'] {
  background: #eef3ff;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
}

.item-meta {
  font-size: 11.5px;
  color: var(--text-3);
}

.form {
  overflow: auto;
  padding-right: 4px;
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  margin-bottom: 12px;
}

.k {
  margin-bottom: 5px;
  font-size: 12px;
  color: var(--text-3);
}

.group {
  margin-bottom: 14px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12.5px;
  color: var(--text-2);
}

.frow {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.frow .grow {
  flex: 1;
}

.tiny {
  width: 96px;
}

.err {
  color: #cf1322;
  font-size: 12.5px;
}

.hint {
  padding: 6px 8px;
  font-size: 12px;
  color: var(--text-3);
}

.danger {
  color: #cf1322;
  border-color: #ffccc7;
}

.spacer {
  flex: 1;
}
</style>
