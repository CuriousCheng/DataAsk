<script setup lang="ts">
import { showToast } from '../lib/toast'

function disabled() {
  showToast('演示环境里删除账号是禁用的')
}
</script>

<template>
  <div class="page">
    <h1>危险区域</h1>

    <div class="danger-card">
      <div class="row">
        <div class="text">
          <div class="title">删除账号</div>
          <p class="desc">请注意，删除账号将永久删除所有数据与关联，且无法恢复。</p>
        </div>
        <button class="btn" type="button" disabled @click="disabled">删除账号</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1300px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.danger-card {
  border: 1px solid #ffa39e;
  border-radius: 8px;
  padding: 0 20px;
}

.row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
}

.text {
  flex: 1;
}

.title {
  font-size: 14px;
  font-weight: 600;
}

.desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-2);
}

.btn {
  min-width: 104px;
  background: #fafafa;
  color: #cf1322;
  border-color: #ffccc7;
}
</style>
