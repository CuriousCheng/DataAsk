<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, Upload } from 'lucide-vue-next'
import { user } from '../lib/user'
import { showToast } from '../lib/toast'

const query = ref('')

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return user.skills
  return user.skills.filter(
    (s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q),
  )
})

function upload() {
  showToast('上传技能需要后端接口，先做展示')
}
</script>

<template>
  <div class="page">
    <div class="head">
      <h1>技能</h1>
      <button class="btn" type="button" @click="upload">
        <Upload :size="14" />
        上传技能（.zip）
      </button>
    </div>

    <p class="desc">
      技能定义了智能体可使用的能力。内置技能由系统提供；你也可以上传自己的技能 zip
      文件，其中必须只有一个顶层目录，且目录内包含 SKILL.md。
    </p>

    <div class="search">
      <Search :size="14" />
      <input v-model="query" placeholder="按名称或描述搜索技能" />
    </div>

    <div class="list">
      <div v-for="s in rows" :key="s.name" class="row">
        <div class="row-main">
          <div class="name">{{ s.name }}</div>
          <div class="skill-desc">{{ s.desc }}</div>
        </div>
        <span v-if="s.builtin" class="tag">内置</span>
      </div>
      <div v-if="!rows.length" class="empty-text">没有匹配的技能</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1300px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
}

.desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.7;
  margin-bottom: 14px;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  color: var(--text-3);
  margin-bottom: 6px;
}

.search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
}

.list {
  border-top: 1px solid transparent;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}

.row-main {
  flex: 1;
  min-width: 0;
}

.name {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text-3);
  margin-bottom: 6px;
}

.skill-desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  background: #eef3ff;
  color: #3157c4;
  font-size: 12px;
  white-space: nowrap;
}

.empty-text {
  padding: 60px 0;
  text-align: center;
  color: var(--text-4);
  font-size: 13px;
}
</style>
