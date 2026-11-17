<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { relationsOf, type Model } from '../lib/modeling'
import { getModelJson, putModelJson } from '../lib/api'
import { showToast } from '../lib/toast'

const props = defineProps<{ open: boolean; model: Model | null }>()
const emit = defineEmits<{ close: [] }>()

const alias = ref('')
const description = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open || !props.model) return
    alias.value = props.model.alias
    description.value = props.model.description
  },
)

async function submit() {
  if (!props.model) return
  try {
    const data = await getModelJson(props.model.name)
    data.properties = data.properties || {}
    data.properties.description = description.value
    if (alias.value && alias.value !== data.name) data.properties.alias = alias.value
    for (const c of data.columns) {
      const local = props.model.columns.find((x) => x.name === c.name)
      if (!local) continue
      c.properties = c.properties || {}
      if (local.alias && local.alias !== c.name) c.properties.alias = local.alias
      else delete (c.properties as Record<string, unknown>).alias
      if (local.description) c.properties.description = local.description
      else delete (c.properties as Record<string, unknown>).description
      if (local.primary) c.is_primary_key = true
    }
    await putModelJson(props.model.name, data)
    props.model.alias = alias.value
    props.model.description = description.value
    showToast('已保存到 metadata.yml')
    emit('close')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '保存失败')
  }
}
</script>

<template>
  <div v-if="open && model" class="overlay" @mousedown.self="emit('close')">
    <div class="modal meta-modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">编辑元数据</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="body">
        <div class="two-col">
          <div class="field">
            <div class="k">名称</div>
            <div class="readonly">{{ model.name }}</div>
          </div>
          <div class="field">
            <div class="k">别名</div>
            <input v-model="alias" class="input" />
          </div>
        </div>

        <div class="field">
          <div class="k">描述</div>
          <textarea v-model="description" class="textarea" rows="2" />
        </div>

        <div class="field">
          <div class="k">列 ({{ model.columns.length }})</div>
          <table class="tbl">
            <thead>
              <tr>
                <th>名称</th>
                <th>别名</th>
                <th>类型</th>
                <th>描述</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in model.columns" :key="c.name">
                <td>{{ c.name }}</td>
                <td><input v-model="c.alias" class="cell-input" /></td>
                <td class="type">{{ c.type }}</td>
                <td><input v-model="c.description" class="cell-input" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="field">
          <div class="k">关系 ({{ relationsOf(model.name).length }})</div>
          <table class="tbl">
            <thead>
              <tr>
                <th>名称</th>
                <th>从</th>
                <th>到</th>
                <th>类型</th>
                <th>描述</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in relationsOf(model.name)" :key="r.id">
                <td>{{ r.name }}</td>
                <td>{{ r.fromModel }}.{{ r.fromColumn }}</td>
                <td>{{ r.toModel }}.{{ r.toColumn }}</td>
                <td>{{ r.type }}</td>
                <td><input v-model="r.description" class="cell-input" /></td>
              </tr>
              <tr v-if="!relationsOf(model.name).length">
                <td colspan="5" class="empty-cell">暂无关系</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" @click="submit">提交</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meta-modal {
  width: 790px;
  max-width: calc(100vw - 40px);
}

.body {
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 4px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.field {
  margin-bottom: 18px;
}

.k {
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.readonly {
  height: 34px;
  display: flex;
  align-items: center;
  font-size: 13px;
}

.textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  resize: vertical;
  outline: none;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: 1px solid var(--line);
}

.tbl th {
  height: 44px;
  padding: 0 12px;
  text-align: left;
  font-weight: 500;
  color: var(--text-2);
  background: #fafafa;
  border-bottom: 1px solid var(--line);
}

.tbl td {
  padding: 8px 12px;
  border-bottom: 1px solid #f2f2f2;
}

.tbl tr:last-child td {
  border-bottom: none;
}

.cell-input {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.type {
  color: var(--text-2);
  white-space: nowrap;
}

.empty-cell {
  text-align: center;
  color: var(--text-4);
  padding: 20px;
}
</style>
