<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Copy, Plus, X } from 'lucide-vue-next'
import Dropdown from '../components/Dropdown.vue'
import { AI_LANGS, TIMEZONES, project, type FieldType } from '../lib/project'
import { showToast } from '../lib/toast'

const langOptions = AI_LANGS.map((v) => ({ value: v, label: v }))
const tzOptions = TIMEZONES.map((v) => ({ value: v, label: v }))
const FIELD_TYPES = [
  { value: 'includes', label: '包含（includes）' },
  { value: 'excludes', label: '不包含（excludes）' },
  { value: 'custom', label: '自定义字段' },
]

const FIELD_HINT: Record<FieldType, string> = {
  includes: '涵盖的主题、指标或数据范围，供智能体判断问题是否适用。每个项目各写一行。',
  excludes: '不在这个项目范围内的主题或数据，避免智能体误选。每个项目各写一行。',
  custom: '补充其他分类信息，如数据环境、地区。名称仅限英文字母、数字与下划线，每个项目各写一行。',
}

const draft = reactive({
  name: project.name,
  lang: project.lang,
  timezone: project.timezone,
  description: project.description,
  fields: project.fields.map((f) => ({ ...f })),
})

const savedSnapshot = ref(JSON.stringify(draft))

const dirty = computed(() => JSON.stringify(draft) !== savedSnapshot.value)

function addField() {
  draft.fields.push({
    id: `f-${Date.now()}`,
    type: 'includes',
    name: '',
    value: '',
  })
}

function removeField(id: string) {
  draft.fields = draft.fields.filter((f) => f.id !== id)
}

function copyId() {
  navigator.clipboard?.writeText(project.id).then(
    () => showToast(`已复制项目 ID：${project.id}`),
    () => showToast(`项目 ID：${project.id}`),
  )
}

function save() {
  Object.assign(project, {
    name: draft.name,
    lang: draft.lang,
    timezone: draft.timezone,
    description: draft.description,
    fields: draft.fields.map((f) => ({ ...f })),
    updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/'),
  })
  savedSnapshot.value = JSON.stringify(draft)
}

function discard() {
  const saved = JSON.parse(savedSnapshot.value)
  draft.name = saved.name
  draft.lang = saved.lang
  draft.timezone = saved.timezone
  draft.description = saved.description
  draft.fields = saved.fields
}
</script>

<template>
  <div class="page">
    <h1>常规</h1>

    <h2 class="section-title">基本资料</h2>
    <section class="card">
      <div class="row">
        <label>项目 ID:</label>
        <div class="ctrl id-ctrl">
          <input class="input" :value="project.id" readonly />
          <button class="icon-btn" type="button" aria-label="复制项目 ID" @click="copyId">
            <Copy :size="15" />
          </button>
        </div>
      </div>

      <div class="row">
        <label>项目名称:</label>
        <div class="ctrl">
          <input v-model="draft.name" class="input" />
        </div>
      </div>

      <div class="row">
        <label>AI 回应语言:</label>
        <div class="ctrl">
          <Dropdown v-model="draft.lang" :options="langOptions" searchable />
          <p class="hint">此设置会影响 AI 回复你时使用的语言。</p>
        </div>
      </div>

      <div class="row">
        <label>项目时区:</label>
        <div class="ctrl">
          <Dropdown v-model="draft.timezone" :options="tzOptions" searchable />
          <p class="hint">
            此设置会影响 DataAsk 回答时区相关问题的准确度，以及日期与时间字段的显示方式。
          </p>
        </div>
      </div>
    </section>

    <h2 class="section-title desc-title">
      项目描述
      <span class="mcp-badge">MCP</span>
    </h2>
    <section class="card desc-card">
      <p class="desc-hint">外部智能体通过 MCP 选择项目时会读取这些内容，请勿放入账号密码或机密信息。</p>

      <div class="field-block">
        <label class="block-label">描述</label>
        <textarea
          v-model="draft.description"
          class="textarea"
          maxlength="1000"
          placeholder="简要说明这个项目的数据范围与使用对象，例如：公司费用预算与实绩追踪，供财务与各部门主管使用。"
        />
        <div class="counter">{{ draft.description.length }} / 1,000</div>
      </div>

      <div class="field-block">
        <label class="block-label">字段</label>
        <p v-if="!draft.fields.length" class="hint">
          尚未添加字段。可添加包含（includes）、不包含（excludes）或自定义字段。
        </p>

        <div v-for="f in draft.fields" :key="f.id" class="field-row">
          <div class="field-row-head">
            <Dropdown
              v-model="f.type"
              :options="FIELD_TYPES"
              width="150px"
              @update:model-value="(v) => (f.type = v as FieldType)"
            />
            <input v-if="f.type === 'custom'" v-model="f.name" class="input name-input" placeholder="名称" />
            <button class="icon-btn field-remove" type="button" aria-label="删除字段" @click="removeField(f.id)">
              <X :size="16" />
            </button>
          </div>
          <textarea v-model="f.value" class="textarea field-textarea" maxlength="400" />
          <div class="field-hint">
            <span>{{ FIELD_HINT[f.type] }}</span>
            <span class="counter">{{ f.value.length }} / 400</span>
          </div>
        </div>

        <button class="add-field" type="button" @click="addField">
          <Plus :size="14" />
          添加字段
        </button>
      </div>

      <div class="updated">{{ project.updatedAt ? `最后更新时间为 ${project.updatedAt}` : '尚未更新' }}</div>
    </section>

    <div class="save-bar">
      <span v-if="dirty" class="dirty-text">有未保存的更改</span>
      <span class="spacer" />
      <button class="btn" type="button" :disabled="!dirty" @click="discard">放弃更改</button>
      <button class="btn btn-primary" type="button" :disabled="!dirty" @click="save">保存</button>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1180px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 18px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 18px 0 10px;
}

.desc-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mcp-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 4px;
  background: #eef3ff;
  color: #3a5ccc;
  font-size: 12px;
  font-weight: 500;
}

.card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 26px 28px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
}

.row > label {
  flex: 0 0 130px;
  padding-top: 8px;
  text-align: right;
  font-size: 13px;
  color: var(--text);
}

.ctrl {
  flex: 1;
  max-width: 870px;
}

.id-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.6;
}

.desc-card {
  padding: 22px 26px;
}

.desc-hint {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 18px;
}

.field-block {
  margin-bottom: 18px;
}

.block-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
}

.textarea {
  width: 100%;
  min-height: 96px;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  font: inherit;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
}

.textarea:focus {
  border-color: #9aa7ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.counter {
  margin-top: 6px;
  text-align: right;
  font-size: 12px;
  color: var(--text-3);
}

.field-row {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fafafa;
}

.field-row-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.name-input {
  width: 180px;
}

.field-remove {
  margin-left: auto;
}

.field-textarea {
  min-height: 84px;
  background: #fff;
}

.field-hint {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-3);
}

.add-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
  color: var(--text-2);
  font-size: 13px;
}

.add-field:hover {
  border-color: #bfbfbf;
  background: #fafafa;
}

.updated {
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-3);
}

.save-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 12px 0;
  background: #fff;
}

.dirty-text {
  font-size: 13px;
  color: var(--text-2);
}
</style>
