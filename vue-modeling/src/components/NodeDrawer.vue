<script setup lang="ts">
import { computed, ref } from 'vue'
import { X, Eye, Pencil } from 'lucide-vue-next'
import { relationsOf, type Model, type Relation } from '../lib/modeling'
import { getModelJson, putModelJson } from '../lib/api'
import { showToast } from '../lib/toast'

const props = defineProps<{ model: Model | null; highlight?: string | null }>()
const emit = defineEmits<{ close: []; edit: []; editRelation: [relation: Relation] }>()

const expandedCol = ref<string | null>(null)
const previewOpen = ref(false)

const relations = computed(() => (props.model ? relationsOf(props.model.name) : []))

const previewNote = '后端没有提供单表预览接口（只有 /api/ask），这里暂不显示数据'

function toggleCol(name: string) {
  expandedCol.value = expandedCol.value === name ? null : name
}

async function saveCol(colName: string) {
  if (!props.model) return
  try {
    const data = await getModelJson(props.model.name)
    const col = data.columns.find((x) => x.name === colName)
    if (col) {
      col.properties = col.properties || {}
      const target = props.model.columns.find((x) => x.name === colName)
      if (target) {
        col.properties.alias = target.alias
        col.properties.description = target.description
      }
    }
    await putModelJson(props.model.name, data)
    showToast('已保存到 metadata.yml')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '保存失败')
  }
}
</script>

<template>
  <aside v-if="model" class="drawer">
    <header class="drawer-head">
      <button class="close" type="button" aria-label="关闭" @click="emit('close')">
        <X :size="16" />
      </button>
      <span class="title">{{ model.name }}</span>
      <button class="btn btn-sm edit" type="button" @click="emit('edit')">
        <Pencil :size="13" />
        编辑
      </button>
    </header>

    <div class="drawer-body">
      <div class="kv-row">
        <div class="kv">
          <div class="k">名称</div>
          <div class="v">{{ model.name }}</div>
        </div>
        <div class="kv">
          <div class="k">别名</div>
          <div class="v">{{ model.alias }}</div>
        </div>
      </div>

      <div class="block">
        <div class="k">描述</div>
        <div class="v desc">{{ model.description }}</div>
      </div>

      <div class="block">
        <div class="table-title">列 ({{ model.columns.length }})</div>
        <table class="tbl">
          <thead>
            <tr>
              <th style="width: 40px" />
              <th>名称</th>
              <th>别名</th>
              <th>类型</th>
              <th>描述</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="c in model.columns" :key="c.name">
              <tr class="col-line" :data-active="highlight === c.alias" @click="toggleCol(c.name)">
                <td>
                  <button class="plus" type="button" @click.stop="toggleCol(c.name)">
                    {{ expandedCol === c.name ? '−' : '+' }}
                  </button>
                </td>
                <td>{{ c.name }}</td>
                <td>{{ c.alias }}</td>
                <td>{{ c.type }}</td>
                <td class="ellipsis">{{ c.description }}</td>
              </tr>
              <tr v-if="expandedCol === c.name" class="col-detail">
                <td />
                <td colspan="4">
                  <div class="k">别名</div>
                  <input v-model="c.alias" class="cell-input" />
                  <div class="k" style="margin-top: 8px">描述</div>
                  <textarea v-model="c.description" class="textarea" rows="2" />
                  <div style="margin-top: 8px">
                    <button class="btn btn-sm" type="button" @click="saveCol(c.name)">保存</button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="block">
        <div class="table-title">关系 ({{ relations.length }})</div>
        <table class="tbl">
          <thead>
            <tr>
              <th style="width: 40px" />
              <th>名称</th>
              <th>从</th>
              <th>到</th>
              <th>类型</th>
              <th>描述</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in relations" :key="r.id" class="rel-line" @click="emit('editRelation', r)">
              <td><span class="plus">›</span></td>
              <td>{{ r.name }}</td>
              <td class="ellipsis">{{ r.fromModel }}.{{ r.fromColumn }}</td>
              <td class="ellipsis">{{ r.toModel }}.{{ r.toColumn }}</td>
              <td>{{ r.type }}</td>
              <td class="ellipsis">{{ r.description }}</td>
            </tr>
            <tr v-if="!relations.length">
              <td colspan="6" class="empty-cell">暂无关系</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="block">
        <div class="table-title">数据预览（100 行）</div>
        <button class="btn" type="button" @click="previewOpen = !previewOpen">
          <Eye :size="13" />
          预览数据
        </button>

        <div v-if="previewOpen" class="preview">
          <p class="empty-cell">{{ previewNote }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.drawer {
  width: 830px;
  flex: 0 0 830px;
  height: 100%;
  background: #fff;
  border-left: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.drawer-head {
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
  margin-right: 12px;
  font-size: 15px;
  font-weight: 600;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px 40px;
}

.kv-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 18px;
}

.kv .k,
.block .k {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 4px;
}

.kv .v {
  font-size: 13px;
}

.block {
  margin-bottom: 20px;
}

.desc {
  font-size: 13px;
  line-height: 1.7;
}

.table-title {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 8px;
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
  padding: 10px 12px;
  border-bottom: 1px solid #f2f2f2;
}

.tbl tr:last-child td {
  border-bottom: none;
}

.col-line {
  cursor: pointer;
}

.col-line[data-active='true'] td {
  background: #eef3ff;
}

.rel-line {
  cursor: pointer;
}

.rel-line:hover td {
  background: #fafafa;
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

.col-line:hover td {
  background: #fafafa;
}

.plus {
  width: 20px;
  height: 20px;
  color: var(--text-3);
}

.ellipsis {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-detail td {
  background: #f7f9ff;
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

.preview {
  margin-top: 10px;
  max-height: 240px;
  overflow: auto;
  border: 1px solid var(--line);
}

.empty-cell {
  text-align: center;
  color: var(--text-4);
  padding: 20px;
}
</style>
