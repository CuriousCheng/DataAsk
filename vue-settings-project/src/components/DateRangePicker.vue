<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{ startDate?: string; endDate?: string }>(),
  { startDate: '', endDate: '' },
)
const emit = defineEmits<{ change: [range: { start: string; end: string }] }>()

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function parse(iso: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function fmt(d: Date | null) {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const start = ref<Date | null>(parse(props.startDate))
const end = ref<Date | null>(parse(props.endDate))
const open = ref(false)
const view = ref(new Date(2026, 10, 1))

const leftMonth = computed(() => view.value)
const rightMonth = computed(() => new Date(view.value.getFullYear(), view.value.getMonth() + 1, 1))

const label = computed(() => ({
  start: fmt(start.value) || '开始日期',
  end: fmt(end.value) || '结束日期',
}))

function cellsFor(month: Date) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const offset = (new Date(year, m, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const prevDays = new Date(year, m, 0).getDate()
  const cells: { day: number; date: Date; outside: boolean }[] = []
  for (let i = offset - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, date: new Date(year, m - 1, prevDays - i), outside: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, m, d), outside: false })
  }
  while (cells.length < 42) {
    const d = cells.length - offset - daysInMonth + 1
    cells.push({ day: d, date: new Date(year, m + 1, d), outside: true })
  }
  return cells
}

const same = (a: Date | null, b: Date) =>
  !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

function inRange(d: Date) {
  return !!start.value && !!end.value && d > start.value && d < end.value
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
    emit('change', { start: fmt(start.value), end: fmt(end.value) })
  }
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
        <button class="nav" type="button" @click="shift(-12)">«</button>
        <button class="nav" type="button" @click="shift(-1)">‹</button>
        <div class="months">
          <div class="month-title">{{ leftMonth.getFullYear() }}年 {{ leftMonth.getMonth() + 1 }}月</div>
          <div class="month-title">{{ rightMonth.getFullYear() }}年 {{ rightMonth.getMonth() + 1 }}月</div>
        </div>
        <button class="nav" type="button" @click="shift(1)">›</button>
        <button class="nav" type="button" @click="shift(12)">»</button>
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
              :data-start="same(start, c.date)"
              :data-end="same(end, c.date)"
              :data-range="inRange(c.date)"
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
  left: 0;
  width: 600px;
  padding: 10px 12px 4px;
  z-index: 50;
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
  font-size: 13px;
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
}

.day:hover {
  background: var(--hover);
}

.day[data-outside='true'] {
  color: var(--text-4);
}

.day[data-range='true'] {
  background: #eef3ff;
}

.day[data-start='true'] {
  background: #2f54eb;
  color: #fff;
}

.day[data-end='true'] {
  border: 1px solid #2f54eb;
  color: #2f54eb;
  font-weight: 600;
}
</style>
