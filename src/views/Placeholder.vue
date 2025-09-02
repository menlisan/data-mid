<template>
  <div class="placeholder-container">
    <el-card class="placeholder-card">
      <template #header>
        <div class="card-header">
          <span class="title">{{ title }}</span>
          <el-tag type="info" size="small">开发中</el-tag>
        </div>
      </template>
      <div class="placeholder-content">
        <el-empty :image-size="200" description="页面开发中，敬请期待...">
          <template #image>
            <el-icon :size="100" color="#909399">
              <Construction />
            </el-icon>
          </template>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Construction } from '@element-plus/icons-vue'

const route = useRoute()

const title = computed(() => {
  return route.meta?.title || '页面开发中'
})
</script>

<style scoped>
.placeholder-container {
  padding: 20px;
  height: 100%;
}

.placeholder-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.placeholder-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}
</style>
