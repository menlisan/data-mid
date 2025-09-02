<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  ElCard,
  ElTable,
  ElTableColumn,
  ElButton,
  ElTag
} from 'element-plus'
import { Echart } from '@/components/Echart'
import type { EChartsOption } from 'echarts'
import {
  getSummaryMetrics,
  getRecentTasks,
  getTaskTrend,
  getStatusDistribution,
  type RecentTaskItem,
  type StatusDistributionItem
} from '@/api/modules/dashboard'

const router = useRouter()

// 加载状态
const loadingSummary = ref(false)
const loadingRecent = ref(false)
const loadingCharts = ref(false)

// 统计卡片数据
const summary = reactive({
  running: 0,
  pending: 0,
  error: 0,
  doneToday: 0
})

// 最近任务
const recentTasks = ref<RecentTaskItem[]>([])
const recentTotal = ref(0)
const recentPage = ref(1)
const pageSize = ref(6)

// 图表配置
const trendOptions = ref<EChartsOption>({})
const statusPieOptions = ref<EChartsOption>({})

// 状态展示配置
const statusMap: Record<RecentTaskItem['status'], { text: string; type: any }> = {
  running: { text: '运行中', type: 'success' },
  pending: { text: '等待中', type: 'info' },
  error: { text: '异常', type: 'danger' },
  done: { text: '已完成', type: 'primary' },
  stopped: { text: '已停止', type: 'warning' }
}

// 跳转到任务列表（带筛选）
const goTaskList = (status?: string) => {
  router.push({
    path: '/task/manual',
    query: status ? { status } : undefined
  })
}

// 卡片点击
const onCardClick = (target: 'running' | 'pending' | 'error' | 'doneToday') => {
  const map = { running: 'running', pending: 'pending', error: 'error', doneToday: 'done' }
  goTaskList(map[target])
}

// 操作 - 启用
const handleEnable = (row: RecentTaskItem) => {
  ElMessage.success(`已提交启用：${row.name}`)
}

// 操作 - 停止
const handleStop = (row: RecentTaskItem) => {
  ElMessageBox.confirm(`确认停止任务「${row.name}」吗？`, '提示', {
    type: 'warning'
  })
    .then(() => {
      ElMessage.success('已停止')
    })
    .catch(() => {})
}

// 操作 - 详情
const handleDetail = (row: RecentTaskItem) => {
  router.push({ path: '/task/detail', query: { id: String(row.id) } })
}

// 拉取统计
const fetchSummary = async () => {
  loadingSummary.value = true
  try {
    const res = await getSummaryMetrics().catch(() => null)
    if (res && (res as any).data) {
      const data = (res as any).data
      summary.running = data.running ?? 0
      summary.pending = data.pending ?? 0
      summary.error = data.error ?? 0
      summary.doneToday = data.doneToday ?? 0
    } else {
      summary.running = 0
      summary.pending = 0
      summary.error = 0
      summary.doneToday = 0
    }
  } finally {
    loadingSummary.value = false
  }
}

// 拉取最近任务
const fetchRecent = async () => {
  loadingRecent.value = true
  try {
    const res = await getRecentTasks({ page: recentPage.value, pageSize: pageSize.value }).catch(
      () => null
    )
    if (res && (res as any).data) {
      const data = (res as any).data
      recentTasks.value = data.list || []
      recentTotal.value = data.total || 0
    } else {
      recentTasks.value = []
      recentTotal.value = 0
    }
  } finally {
    loadingRecent.value = false
  }
}

// 拉取趋势折线图
const fetchTrend = async () => {
  const res = await getTaskTrend({ days: 14 }).catch(() => null)
  const arr = res && (res as any).data ? (res as any).data : []
  const x = arr.map((d: any) => d.date)
  const y = arr.map((d: any) => d.count)
  trendOptions.value = {
    grid: { left: 24, right: 24, top: 32, bottom: 24 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: x, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        smooth: true,
        data: y,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64,158,255,0.35)' },
              { offset: 1, color: 'rgba(64,158,255,0.05)' }
            ]
          }
        }
      }
    ]
  }
}

// 拉取状态分布饼图
const fetchStatusPie = async () => {
  const res = await getStatusDistribution().catch(() => null)
  const data: StatusDistributionItem[] = res && (res as any).data ? (res as any).data : []
  const legend = data.map((d: StatusDistributionItem) => d.name)
  statusPieOptions.value = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, data: legend },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data
      }
    ]
  }
}

const fetchAll = async () => {
  loadingCharts.value = true
  try {
    await Promise.all([fetchSummary(), fetchRecent(), fetchTrend(), fetchStatusPie()])
  } finally {
    loadingCharts.value = false
  }
}

onMounted(fetchAll)

// 样式与渐变
const gradientCards = computed(() => [
  {
    key: 'running',
    title: '运行中任务',
    value: summary.running,
    gradient: 'linear-gradient(120deg, #409eff, #79bbff)'
  },
  {
    key: 'pending',
    title: '等待中任务',
    value: summary.pending,
    gradient: 'linear-gradient(120deg, #e6a23c, #f3d19e)'
  },
  {
    key: 'error',
    title: '异常任务',
    value: summary.error,
    gradient: 'linear-gradient(120deg, #f56c6c, #fab6b6)'
  },
  {
    key: 'doneToday',
    title: '今日完成任务',
    value: summary.doneToday,
    gradient: 'linear-gradient(120deg, #67c23a, #b3e19d)'
  }
])
</script>

<template>
  <div class="p-16">
    <!-- 统计卡片 -->
    <div class="grid gap-16 md:grid-cols-2 xl:grid-cols-4 sm:grid-cols-2 grid-cols-1 mb-16">
      <ElCard
        v-for="card in gradientCards"
        :key="card.key"
        shadow="hover"
        class="cursor-pointer transition-all duration-300 hover:-translate-y-1"
        @click="onCardClick(card.key as any)"
      >
        <div class="rounded-lg text-white p-16" :style="{ background: card.gradient }">
          <div class="text-sm opacity-90">{{ card.title }}</div>
          <div class="text-32 font-700 mt-8">{{ card.value }}</div>
          <div class="text-xs opacity-85 mt-6">点击查看</div>
        </div>
      </ElCard>
    </div>

    <!-- 最近任务列表 -->
    <ElCard class="mb-16" shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-600">最近任务</span>
          <div>
            <ElButton text type="primary" @click="fetchRecent">刷新</ElButton>
            <ElButton type="primary" @click="goTaskList()">加载更多</ElButton>
          </div>
        </div>
      </template>
      <ElTable :data="recentTasks" v-loading="loadingRecent" size="small" class="w-full">
        <ElTableColumn prop="name" label="任务名称" min-width="180" />
        <ElTableColumn prop="owner" label="负责人" width="120" />
        <ElTableColumn prop="submitTime" label="提交日期" min-width="160" />
        <ElTableColumn prop="finishTime" label="完成时间" min-width="160" />
        <ElTableColumn label="耗时" width="120">
          <template #default="scope">
            <span v-if="scope && scope.row && scope.row.durationMs"
              >{{ Math.round(scope.row.durationMs / 1000) }}s</span
            >
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="120">
          <template #default="scope">
            <template v-if="scope && scope.row">
              <ElTag :type="statusMap[scope.row.status].type" effect="light">{{
                statusMap[scope.row.status].text
              }}</ElTag>
            </template>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="220" fixed="right">
          <template #default="scope">
            <template v-if="scope && scope.row">
              <ElButton link type="success" @click="handleEnable(scope.row)">启用</ElButton>
              <ElButton link type="warning" @click="handleStop(scope.row)">停止</ElButton>
              <ElButton link type="primary" @click="handleDetail(scope.row)">详情</ElButton>
            </template>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="flex justify-end mt-12" v-if="recentTotal > pageSize">
        <ElButton type="primary" link @click="goTaskList()">加载更多 →</ElButton>
      </div>
    </ElCard>

    <!-- 图表区 -->
    <div class="grid gap-16 xl:grid-cols-3 md:grid-cols-1">
      <ElCard shadow="hover" class="xl:col-span-2">
        <template #header>
          <span class="font-600">任务执行趋势</span>
        </template>
        <Echart :options="trendOptions" :height="320" />
      </ElCard>
      <ElCard shadow="hover">
        <template #header>
          <span class="font-600">任务状态分布</span>
        </template>
        <Echart :options="statusPieOptions" :height="320" />
      </ElCard>
    </div>

    <!-- 快捷操作 -->
    <div class="grid gap-16 md:grid-cols-2 grid-cols-1 mt-16">
      <ElCard shadow="hover" class="cursor-pointer" @click="router.push('/lineage/impact')">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-600">血缘分析</div>
            <div class="text-xs text-gray-500 mt-4">查看数据依赖与影响路径</div>
          </div>
          <div class="i-vi-ep-share text-28 text-primary"></div>
        </div>
      </ElCard>
      <ElCard shadow="hover" class="cursor-pointer" @click="router.push('/governance/compare')">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-600">数据治理</div>
            <div class="text-xs text-gray-500 mt-4">进入治理首页，进行结构对比与校验</div>
          </div>
          <div class="i-vi-ep-monitor text-28 text-primary"></div>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.text-32 {
  font-size: 32px;
}
</style>
