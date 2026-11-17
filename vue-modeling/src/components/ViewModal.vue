<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { showToast } from '../lib/toast'
import { http } from '@dataask/shared-ui'
import { base } from '../lib/api'

export interface ProjectView {
  name: string
  description: string
  statement: string
}

const props = defineProps<{ open: boolean; view: ProjectView | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const name = ref('')
const description = ref('')
const statement = ref('')
const error = ref('')
const busy = ref(false)
const editing = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    error.value = ''
    editing.value = !!props.view
    name.value = props.view?.name ?? ''
    description.value = props.view?.description ?? ''
    statement.value = props.view?.statement ?? 'SELECT * FROM '
  },
)

async function save() {
  const n = name.value.trim()
  if (!n) {
    showToast('先填视图名')
    return
  }
  if (!statement.value.trim()) {
    showToast('SQL 不能为空')
    return
  }
  busy.value = true
  error.value = ''
  try {
    if (editing.value) {
      await http.put(base() + '/views/' + encodeURIComponent(n) + '/json', {
        data: {
          name: n,
          properties: { description: description.value },
          statement: statement.value,
        },
      })
    } else {
      await http.post(base() + '/views', {
        name: n,
        description: description.value,
        statement: statement.value,
      })
    }
    showToast(editing.value ? '视图已保存' : '视图已创建')
    emit('saved')
    emit('close')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!editing.value) return
  const n = name.value.trim()
  if (!window.confirm('删除视图 ' + n + ' ？')) return
  try {
    await http.del(base() + '/views/' + encodeURIComponent(n))
    showToast('已删除')
    emit('saved')
    emit('close')
  } catch (e) {
    showToast(e instanceof Error ? e.message : '删除失败')
  }
}
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal view-modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">{{ editing ? '视图 ' + name : '新建视图' }}</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="body">
        <div class="field">
          <div class="k">名称（英文，同时是目录名）</div>
          <input v-model="name" class="input" :disabled="editing" placeholder="big_orders" />
        </div>
        <div class="field">
          <div class="k">说明</div>
          <input v-model="description" class="input" placeholder="金额大于 10 万的订单" />
        </div>
        <div class="field">
          <div class="k">SQL（只能是 SELECT / WITH）</div>
          <textarea v-model="statement" class="sql" spellcheck="false" />
        </div>
        <p v-if="error" class="err">{{ error }}</p>
        <p class="hint">保存后到「知识」页能看到 views/&lt;名&gt;/metadata.yml 和 sql.yml。</p>
      </div>

      <div class="modal-foot">
        <button class="btn danger" type="button" :disabled="!editing" @click="remove">删除</button>
        <span class="spacer" />
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" :disabled="busy" @click="save">
          {{ busy ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-modal {
  width: 640px;
}

.field {
  margin-bottom: 14px;
}

.k {
  margin-bottom: 5px;
  font-size: 12px;
  color: var(--text-3);
}

.sql {
  width: 100%;
  height: 180px;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12.5px;
  resize: vertical;
  outline: none;
}

.err {
  color: #cf1322;
  font-size: 12.5px;
}

.hint {
  font-size: 12px;
  color: var(--text-4);
}

.danger {
  color: #cf1322;
  border-color: #ffccc7;
}

.spacer {
  flex: 1;
}
</style>
