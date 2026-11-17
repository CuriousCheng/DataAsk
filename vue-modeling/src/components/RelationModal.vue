<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { modeling, type Relation } from '../lib/modeling'
import { getRelationships, joinTypeToApi, putRelationships } from '../lib/api'
import { showToast } from '../lib/toast'

const props = defineProps<{ open: boolean; relation: Relation | null }>()
const emit = defineEmits<{ close: [] }>()

const type = ref<Relation['type']>('多对一')
const description = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open || !props.relation) return
    type.value = props.relation.type
    description.value = props.relation.description
  },
)

function toApi(r: Relation) {
  return {
    name: r.name,
    models: [r.fromModel, r.toModel],
    join_type: joinTypeToApi(r.type),
    condition: r.fromModel + '.' + r.fromColumn + ' = ' + r.toModel + '.' + r.toColumn,
  }
}

async function save() {
  if (!props.relation) return
  try {
    const list = await getRelationships()
    const target = toApi({ ...props.relation, type: type.value })
    const idx = list.findIndex((x) => x.name === props.relation!.name)
    if (idx >= 0) list[idx] = target
    else list.push(target)
    await putRelationships(list)
    props.relation.type = type.value
    props.relation.description = description.value
    showToast('关系已保存到 relationships.yml')
    emit('close')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '保存失败')
  }
}

async function remove() {
  if (!props.relation) return
  try {
    const list = await getRelationships()
    const next = list.filter((x) => x.name !== props.relation!.name)
    await putRelationships(next)
    modeling.relations = modeling.relations.filter((r) => r.id !== props.relation!.id)
    showToast('关系已删除')
    emit('close')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '删除失败')
  }
}
</script>

<template>
  <div v-if="open && relation" class="overlay" @mousedown.self="emit('close')">
    <div class="modal rel-modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">关系</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="body">
        <div class="two-col">
          <div class="field">
            <div class="k">从</div>
            <div class="readonly">{{ relation.fromModel }}.{{ relation.fromColumn }}</div>
          </div>
          <div class="field">
            <div class="k">到</div>
            <div class="readonly">{{ relation.toModel }}.{{ relation.toColumn }}</div>
          </div>
        </div>

        <div class="field">
          <div class="k">类型</div>
          <select v-model="type" class="select">
            <option>多对一</option>
            <option>一对多</option>
            <option>一对一</option>
          </select>
        </div>

        <div class="field">
          <div class="k">描述</div>
          <textarea v-model="description" class="textarea" rows="3" />
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn danger" type="button" @click="remove">删除</button>
        <span class="spacer" />
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rel-modal {
  width: 620px;
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
  color: var(--text);
}

.select {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: #fff;
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

.danger {
  color: #cf1322;
  border-color: #ffccc7;
}

.danger:hover {
  background: #fff1f0;
}
</style>
