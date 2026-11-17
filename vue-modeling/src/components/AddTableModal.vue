<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { showToast } from '../lib/toast'
import {
  addModel,
  listSchemas,
  listSources,
  listTables,
  type DataSource,
} from '../lib/api'
import { loadProject } from '../lib/modeling'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; added: [] }>()

const sources = ref<DataSource[]>([])
const schemas = ref<string[]>([])
const tables = ref<string[]>([])

const dsId = ref('')
const schema = ref('')
const table = ref('')
const description = ref('')
const primaryKey = ref('')
const busy = ref(false)
const msg = ref('')

async function loadSources() {
  try {
    sources.value = await listSources()
    if (sources.value.length) {
      dsId.value = sources.value[0].id
      await onSource()
    } else {
      msg.value = '没有数据源，先去 设置 → 数据连接 添加'
    }
  } catch (e) {
    msg.value = e instanceof Error ? e.message : '读取数据源失败'
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    msg.value = ''
    if (!sources.value.length) await loadSources()
  },
  { immediate: true },
)

async function onSource() {
  schema.value = ''
  table.value = ''
  tables.value = []
  if (!dsId.value) return
  try {
    schemas.value = await listSchemas(dsId.value)
  } catch (e) {
    msg.value = e instanceof Error ? e.message : '读取 schema 失败'
  }
}

async function onSchema() {
  table.value = ''
  if (!dsId.value || !schema.value) return
  try {
    tables.value = await listTables(dsId.value, schema.value)
  } catch (e) {
    msg.value = e instanceof Error ? e.message : '读取表失败'
  }
}

async function submit() {
  if (!table.value) {
    showToast('先选一张表')
    return
  }
  busy.value = true
  msg.value = ''
  try {
    const r = await addModel({
      datasource_id: dsId.value,
      schema_name: schema.value,
      table: table.value,
      description: description.value,
      model_name: table.value,
      primary_key: primaryKey.value || undefined,
    })
    showToast('已加入 ' + r.model + '（' + r.columns + ' 列）')
    await loadProject()
    emit('added')
    emit('close')
  } catch (e) {
    msg.value = e instanceof Error ? e.message : '加入失败'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal add-modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">加入表</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="body">
        <div class="field">
          <div class="k">数据源</div>
          <select v-model="dsId" class="input" @change="onSource">
            <option v-for="s in sources" :key="s.id" :value="s.id">
              {{ s.name }}（{{ s.type }}）
            </option>
          </select>
        </div>

        <div class="two-col">
          <div class="field">
            <div class="k">库 / schema</div>
            <select v-model="schema" class="input" @change="onSchema">
              <option value="">（选）</option>
              <option v-for="s in schemas" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="field">
            <div class="k">表</div>
            <select v-model="table" class="input">
              <option value="">（选）</option>
              <option v-for="t in tables" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <div class="field">
          <div class="k">表说明（可空）</div>
          <input v-model="description" class="input" placeholder="例如：销售订单，一行一个订单" />
        </div>

        <div class="field">
          <div class="k">主键列（可空）</div>
          <input v-model="primaryKey" class="input" placeholder="例如 id" />
        </div>

        <p v-if="msg" class="msg">{{ msg }}</p>
        <p class="hint">加入后会自动生成 models/&lt;表名&gt;/metadata.yml</p>
      </div>

      <div class="modal-foot">
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" :disabled="busy || !table" @click="submit">
          {{ busy ? '加入中…' : '加入' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.add-modal {
  width: 640px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field {
  margin-bottom: 16px;
}

.k {
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.msg {
  color: #cf1322;
  font-size: 12.5px;
  margin-bottom: 8px;
}

.hint {
  font-size: 12px;
  color: var(--text-4);
}
</style>
