<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar } from 'lucide-vue-next'

const emit = defineEmits<{ change: [range: { start: Date | null; end: Date | null }] }>()

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

const today = new Date()
const start = ref<Date | null>(null)
const end = ref<Date | null>(null)
const open = ref(false)
const view = ref(new Date(today.getFullYear(), today.getMonth(), 1))

const leftMonth = computed(() => view.value)
const rightMonth = computed(() => new Date(view.value.getFullYear(), view.value.getMonth() + 1, 1))

const label = computed(() => {
  const fmt = (d: Date | null) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''
  if (!start.value) return { start: '开始日期', end: '结束日期' }
  return { start: fmt(start.value), end: end.value ? fmt(end.value) : '结束日期' }
})

function cellsFor(month: Date) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const first = new Date(year, m, 1)
  const offset = (first.getDay() + 6) % 7 // 周一为第一天
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const prevDays = new Date(year, m, 0).getDate()
  const cells: { day: number; date: Date; outside: boolean }[] = []

  for (let i = offset - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, date: new Date(year, m - 1, prevDays - i), outside: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, m, d), outside: false })
  }
  const rest = 42 - cells.length
  for (let d = 1; d <= rest; d++) {
    cells.push({ day: d, date: new Date(year, m + 1, d), outside: true })
  }
  return cells
}

function sameDay(a: Date | null, b: Date) {
  return !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function inRange(d: Date) {
  if (!start.value || !end.value) return false
  return d >= start.value && d <= end.value
}

function pick(d: Date) {
  if (!start.value || (start.value && end.value)) {
    start.value = d
    end.value = null
  } else if (d < start.value) {
    start.value = d
  } else {
    end.value = d
    open.value = false
  }
  emit('change', { start: start.value, end: end.value })
}

function shift(months: number) {
  view.value = new Date(view.value.getFullYear(), view.value.getMonth() + months, 1)
}
</script>

<template>
  <div class="dr">
    <button class="dr-trigger" type="button" @click="open = !open">
      <span :class="{ ph: !start }">{{ label.start }}</span>
      <span class="arrow">→</span>
      <span :class="{ ph: !end }">{{ label.end }}</span>
      <Calendar :size="14" class="cal-icon" />
    </button>

    <div v-if="open" class="pop dr-pop">
      <div class="cal-head">
        <button class="nav" type="button" aria-label="上一年" @click="shift(-12)">«</button>
        <button class="nav" type="button" aria-label="上一月" @click="shift(-1)">‹</button>
        <div class="months">
          <div class="month-title">{{ leftMonth.getFullYear() }}年 {{ leftMonth.getMonth() + 1 }}月</div>
          <div class="month-title">{{ rightMonth.getFullYear() }}年 {{ rightMonth.getMonth() + 1 }}月</div>
        </div>
        <button class="nav" type="button" aria-label="下一月" @click="shift(1)">›</button>
        <button class="nav" type="button" aria-label="下一年" @click="shift(12)">»</button>
      </div>

      <div class="cal-body">
        <div v-for="month in [leftMonth, rightMonth]" :key="month.toISOString()" class="cal">
          <div class="weekdays">
            <span v-for="w in WEEKDAYS" :key="w">{{ w }}</span>
          </div>
          <div class="days">
            <button
              v-for="(c, i) in cellsFor(month)"
              :key="i"
              class="day"
              type="button"
              :data-outside="c.outside"
              :data-selected="sameDay(start, c.date) || sameDay(end, c.date)"
              :data-in-range="inRange(c.date)"
              @click="pick(c.date)"
            >
              {{ c.day }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dr {
  position: relative;
}

.dr-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text);
  background: #fff;
}

.dr-trigger:hover {
  border-color: #bfbfbf;
}

.dr-trigger .ph {
  color: var(--text-4);
}

.arrow {
  color: var(--text-4);
}

.cal-icon {
  color: var(--text-3);
  margin-left: 6px;
}

.dr-pop {
  top: 40px;
  right: 0;
  width: 600px;
  padding: 10px 12px 4px;
}

.cal-head {
  display: grid;
  grid-template-columns: 24px 24px 1fr 24px 24px;
  align-items: center;
  gap: 2px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.nav {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: var(--text-2);
  font-size: 14px;
  line-height: 1;
}

.nav:hover {
  background: var(--hover);
}

.months {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.month-title {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
}

.cal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.cal {
  padding: 8px 6px;
}

.weekdays,
.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.weekdays span {
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-3);
}

.day {
  height: 32px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text);
}

.day:hover {
  background: var(--hover);
}

.day[data-outside='true'] {
  color: var(--text-4);
}

.day[data-in-range='true'] {
  background: var(--blue-soft);
}

.day[data-selected='true'] {
  border: 1px solid var(--text);
  font-weight: 600;
}
</style>
