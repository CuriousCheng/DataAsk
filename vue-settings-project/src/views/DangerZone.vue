<script setup lang="ts">
import { ref } from 'vue'
import Modal from '../components/Modal.vue'

const resetOpen = ref(false)
const deleteOpen = ref(false)
</script>

<template>
  <div class="page">
    <h1>危险区域</h1>

    <div class="danger-card">
      <div class="row">
        <div class="text">
          <div class="title">重置项目</div>
          <p class="desc">请注意，重置会删除该项目当前的所有设置与记录，包括建模页面与首页讨论串中的内容。</p>
        </div>
        <button class="btn danger" type="button" @click="resetOpen = true">重置项目</button>
      </div>

      <div class="divider" />

      <div class="row">
        <div class="text">
          <div class="title">删除项目</div>
          <p class="desc">请注意，删除项目会永久删除所有数据与关联，且无法撤销。</p>
        </div>
        <button class="btn danger" type="button" @click="deleteOpen = true">删除项目</button>
      </div>
    </div>

    <Modal :open="resetOpen" title="确定要重置吗？" width="560px" @close="resetOpen = false">
      <template #footer>
        <button class="btn" type="button" @click="resetOpen = false">取消</button>
        <button class="btn btn-danger" type="button" @click="resetOpen = false">重置</button>
      </template>
    </Modal>

    <Modal :open="deleteOpen" title="确定要删除吗？" width="560px" @close="deleteOpen = false">
      <template #footer>
        <button class="btn" type="button" @click="deleteOpen = false">取消</button>
        <button class="btn btn-danger" type="button" @click="deleteOpen = false">删除</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page {
  max-width: 1400px;
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

.divider {
  height: 1px;
  background: #ffd8d6;
}

.danger {
  min-width: 104px;
  color: #cf1322;
  border-color: #ffccc7;
  background: #fafafa;
}

.danger:hover {
  background: #fff1f0;
}

.btn-danger {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
}

.btn-danger:hover {
  background: #ff7875;
  border-color: #ff7875;
}
</style>
