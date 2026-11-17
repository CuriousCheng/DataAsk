<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Link2, X } from 'lucide-vue-next'
import BrandMark from '../components/BrandMark.vue'
import Composer from '../components/Composer.vue'
import CubeQueryModal from '../components/CubeQueryModal.vue'
import { createThread, projectName } from '../lib/threads'

const router = useRouter()

const bannerVisible = ref(true)
const cubeOpen = ref(false)

const suggestions = [
  { tag: '数据概览', text: '这个业务里每个表各有多少行数据？' },
  { tag: '分布问题', text: '按类别统计，数量最多的前几项是什么？' },
  { tag: '趋势问题', text: '最近的记录按时间统计，趋势如何？' },
]

async function ask(question: string) {
  try {
    const thread = await createThread(projectName(), question.slice(0, 40))
    router.push(`/${thread.id}?q=` + encodeURIComponent(question))
  } catch {
    router.push('/')
  }
}
</script>

<template>
  <div class="home">
    <div class="scroll">
      <div class="empty">
        <BrandMark :size="36" color="#1a1a1a" />
        <h1 class="title">进一步了解你的数据。</h1>
        <p class="hint">试着这样问（示例问题，按你的业务改写）</p>
        <button class="cube-btn" type="button" @click="cubeOpen = true">按指标口径查询</button>

        <div class="cards">
          <button
            v-for="s in suggestions"
            :key="s.tag"
            class="card"
            type="button"
            @click="ask(s.text)"
          >
            <span class="tag">{{ s.tag }}</span>
            <span class="card-text">{{ s.text }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="bottom">
      <div v-if="bannerVisible" class="banner">
        <Link2 :size="15" />
        <span class="banner-text">来看看你的数据！连接你的数据库，DataAsk 就能回答你的数据问题。</span>
        <ArrowRight :size="15" />
        <button class="icon-btn" type="button" aria-label="关闭" @click="bannerVisible = false">
          <X :size="15" />
        </button>
      </div>

      <Composer placeholder="提问以探索你的数据" @submit="ask" />
      <CubeQueryModal :open="cubeOpen" @close="cubeOpen = false" />
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px 12px;
}

.empty {
  width: 100%;
  max-width: 620px;
  text-align: center;
}

.empty svg {
  margin-bottom: 16px;
}

.title {
  font-size: 17px;
  font-weight: 500;
}

.hint {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-3);
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
  text-align: left;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 138px;
  padding: 12px;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: var(--line-strong);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card .tag {
  align-self: flex-start;
}

.card-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
}

.bottom {
  flex: 0 0 auto;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: 0 24px 22px;
}

.banner {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 12px;
  margin-bottom: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: #fff;
  color: var(--text-2);
  font-size: 13px;
}

.banner:hover {
  border-color: var(--line-strong);
}

.banner-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
