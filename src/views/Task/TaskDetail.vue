<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTaskDetailApi } from '@/api/modules/task'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const detail = ref<any>(null)

const fetchDetail = async () => {
  const id = route.query.id as string
  if (!id) {
    ElMessage.error('缺少任务ID')
    return
  }
  loading.value = true
  try {
    const { data } = await getTaskDetailApi(id)
    detail.value = data
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>

<template>
  <div class="p-16">
    <el-card shadow="hover" class="mb-16" v-loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-600">任务详情</span>
          <el-button text type="primary" @click="router.back()">返回</el-button>
        </div>
      </template>
      <div v-if="detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="任务名称">{{ detail.name }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ detail.owner }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ detail.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ detail.finishTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ detail.durationMs ? Math.round(detail.durationMs/1000) + 's' : '--' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="3">{{ detail.description || '--' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <div class="grid gap-16 md:grid-cols-2 grid-cols-1">
      <el-card shadow="hover">
        <template #header>
          <span class="font-600">任务日志</span>
        </template>
        <el-timeline>
          <el-timeline-item v-for="(log, idx) in detail?.logs || []" :key="idx" :timestamp="idx + 1">
            {{ log }}
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span class="font-600">依赖任务</span>
        </template>
        <el-empty v-if="!detail?.dependencies?.length" description="暂无依赖" />
        <el-timeline v-else>
          <el-timeline-item v-for="d in detail.dependencies" :key="d.id">
            {{ d.name }}
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>
