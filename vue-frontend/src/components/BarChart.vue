<script setup lang="ts">
import { computed } from 'vue'
import type { RegionRow } from '../data/demo'

const props = defineProps<{
  rows: RegionRow[]
  yLabel: string
  xLabel: string
}>()

const W = 760
const H = 300
const pad = { top: 12, right: 12, bottom: 62, left: 56 }
const innerW = W - pad.left - pad.right
const innerH = H - pad.top - pad.bottom

const max = computed(() => {
  const m = Math.max(...props.rows.map((r) => Math.max(r.newCustomer, r.returning)), 1)
  const step = Math.pow(10, Math.floor(Math.log10(m)))
  return Math.ceil(m / step) * step
})

const ticks = 6
const groupW = computed(() => innerW / props.rows.length)
const barW = computed(() => Math.min(20, (groupW.value - 16) / 2))
const colors = { newCustomer: '#4c6ef5', returning: '#a9c92b' }

function y(v: number) {
  return pad.top + innerH - (v / max.value) * innerH
}
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" width="100%" role="img" :aria-label="`${yLabel} 按${xLabel}`">
    <g v-for="i in ticks + 1" :key="i">
      <line
        :x1="pad.left"
        :x2="W - pad.right"
        :y1="y((max / ticks) * (i - 1))"
        :y2="y((max / ticks) * (i - 1))"
        :stroke="i === 1 ? '#c9c9c9' : '#ececec'"
        :stroke-dasharray="i === 1 ? undefined : '3 3'"
      />
      <text
        :x="pad.left - 8"
        :y="y((max / ticks) * (i - 1)) + 4"
        text-anchor="end"
        font-size="10"
        fill="#8c8c8c"
      >
        {{ ((max / ticks) * (i - 1)).toLocaleString('en-US') }}
      </text>
    </g>

    <g v-for="(row, idx) in rows" :key="row.region">
      <rect
        :x="pad.left + idx * groupW + groupW / 2 - barW - 2"
        :y="y(row.newCustomer)"
        :width="barW"
        :height="pad.top + innerH - y(row.newCustomer)"
        :fill="colors.newCustomer"
        rx="1"
      />
      <rect
        :x="pad.left + idx * groupW + groupW / 2 + 2"
        :y="y(row.returning)"
        :width="barW"
        :height="pad.top + innerH - y(row.returning)"
        :fill="colors.returning"
        rx="1"
      />
      <text
        :x="pad.left + idx * groupW + groupW / 2"
        :y="pad.top + innerH + 14"
        font-size="10"
        fill="#595959"
        text-anchor="end"
        :transform="`rotate(-35 ${pad.left + idx * groupW + groupW / 2} ${pad.top + innerH + 14})`"
      >
        {{ row.region }}
      </text>
    </g>

    <text :x="pad.left + innerW / 2" :y="H - 6" text-anchor="middle" font-size="11" fill="#595959">
      {{ xLabel }}
    </text>
    <text
      :transform="`rotate(-90 14 ${pad.top + innerH / 2})`"
      x="14"
      :y="pad.top + innerH / 2"
      text-anchor="middle"
      font-size="11"
      fill="#595959"
    >
      {{ yLabel }}
    </text>
  </svg>
</template>
