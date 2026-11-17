<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Search, X } from 'lucide-vue-next'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; submit: [payload: { name: string; timezone: string }] }>()

const TIMEZONES = [
  'Etc/GMT-8',
  'Pacific/Midway (UTC-11:00)',
  'Pacific/Niue (UTC-11:00)',
  'Pacific/Pago_Pago (UTC-11:00)',
  'America/Adak (UTC-10:00)',
  'Pacific/Honolulu (UTC-10:00)',
  'Pacific/Rarotonga (UTC-10:00)',
  'Pacific/Tahiti (UTC-10:00)',
  'Pacific/Marquesas (UTC-09:30)',
  'America/Anchorage (UTC-09:00)',
  'America/Los_Angeles (UTC-08:00)',
  'Asia/Shanghai (UTC+08:00)',
]

const name = ref('')
const timezone = ref('Etc/GMT-8')
const tzOpen = ref(false)
const tzQuery = ref('')

const filtered = computed(() =>
  TIMEZONES.filter((t) => t.toLowerCase().includes(tzQuery.value.toLowerCase())),
)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = ''
    timezone.value = 'Etc/GMT-8'
    tzOpen.value = false
    tzQuery.value = ''
  },
)

function submit() {
  if (!name.value.trim()) return
  emit('submit', { name: name.value, timezone: timezone.value })
}
</script>

<template>
  <div v-if="open" class="overlay" @mousedown.self="emit('close')">
    <div class="modal org-modal" role="dialog" aria-modal="true" aria-label="创建组织">
      <div class="modal-head">
        <h3 class="modal-title">创建组织</h3>
        <button class="icon-btn" type="button" aria-label="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <label class="label" for="org-name">组织名称</label>
        <input id="org-name" v-model="name" class="input" placeholder="组织名称" />

        <label class="label" style="margin-top: 18px">时区</label>
        <div class="tz-wrap">
          <button class="tz-trigger" type="button" @click="tzOpen = !tzOpen">
            <span>{{ timezone }}</span>
            <Search :size="14" />
          </button>

          <div v-if="tzOpen" class="pop tz-pop">
            <div class="tz-search">
              <Search :size="13" />
              <input v-model="tzQuery" placeholder="搜索时区" />
            </div>
            <button
              v-for="tz in filtered"
              :key="tz"
              class="pop-item"
              type="button"
              @click="timezone = tz; tzOpen = false"
            >
              {{ tz }}
              <Check v-if="timezone === tz" :size="14" class="check" />
            </button>
          </div>
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn" type="button" @click="emit('close')">取消</button>
        <button class="btn btn-primary" type="button" :disabled="!name.trim()" @click="submit">
          提交
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.org-modal {
  width: 600px;
}

.label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-2);
}

.tz-wrap {
  position: relative;
}

.tz-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text);
}

.tz-trigger:hover {
  border-color: #bfbfbf;
}

.tz-pop {
  top: 38px;
  left: 0;
  right: 0;
  max-height: 320px;
  overflow-y: auto;
}

.tz-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px 8px;
  color: var(--text-3);
  border-bottom: 1px solid var(--line);
  margin-bottom: 4px;
}

.tz-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
}

.check {
  margin-left: auto;
  color: var(--blue);
}
</style>
