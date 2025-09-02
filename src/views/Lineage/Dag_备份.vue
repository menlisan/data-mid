<script setup lang="ts">
defineOptions({ name: 'LineageDag' })
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElInput, ElButton, ElDialog, ElDatePicker, ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Echart } from '@/components/Echart'
import * as dagre from 'dagre'
import {
  getDag,
  runTask,
  cancelTask,
  resetTask,
  getTaskDetailInfo,
  type DagData
} from '@/api/modules/dag'

const taskId = ref('task_main')
const loading = ref(false)
const dag = ref<DagData | null>(null)
const chartOptions = ref<any>({ series: [] })

const statusColor: Record<string, string> = {
  running: '#67C23A',
  pending: '#409EFF',
  error: '#F56C6C',
  stopped: '#909399',
  done: '#8A2BE2'
}

const statusTextCn: Record<string, string> = {
  running: '运行中',
  pending: '等待',
  error: '异常',
  stopped: '停止',
  done: '完成'
}

const resetDialog = reactive({ visible: false, date: '' })
const detailDialog = reactive({ visible: false })
const detail = ref<any>(null)

const buildOption = (data: DagData) => {
  // 1) dagre 计算顺序（用于减少交叉），直接使用自然坐标
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 60, edgesep: 16, ranksep: 110, ranker: 'network-simplex' })
  g.setDefaultEdgeLabel(() => ({}))
  // 文本宽度测量，确保任务名完整展示
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const font = '12px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial'
  ctx.font = font
  const measure = (t: string) => Math.ceil(ctx.measureText(t).width)

  const NODE_H = 56
  const NAME_GAP = 8
  const PADDING_X = 24
  data.nodes.forEach((n) => {
    const name = n.id
    const status = statusTextCn[n.status] || n.status
    const nameW = measure(name)
    const statusW = measure(status) + 22 // 状态徽标左右内边距
    const width = Math.max(140, nameW + NAME_GAP + statusW + PADDING_X)
    g.setNode(n.id, { width: Math.round(width), height: NODE_H })
  })
  data.edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  const nodes = data.nodes.map((n) => {
    const pos = g.node(n.id)
    const px = Math.round(pos.x as number)
    const py = Math.round(pos.y as number)
    const pw = Math.round(pos.width as number)
    const ph = Math.round(pos.height as number)
    const nameText = n.id
    return {
      id: n.id,
      name: n.id,
      status: n.status,
      statusCn: statusTextCn[n.status] || n.status,
      x: px,
      y: py,
      symbol: 'roundRect',
      symbolSize: [pw, ph],
      label: {
        show: true,
        formatter: (p: any) => `{name|${nameText}}  {status|${p.data.statusCn}}`,
        rich: {
          name: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
          status: {
            color: '#fff',
            backgroundColor: statusColor[n.status] || '#909399',
            borderRadius: 12,
            padding: [2, 8]
          }
        }
      },
      itemStyle: {
        color: '#fff',
        borderColor: 'rgba(85,85,85,0.7)',
        borderWidth: 2,
        shadowColor: n.id === data.id ? 'rgba(16,185,129,0.35)' : 'rgba(15,23,42,0.10)',
        shadowBlur: n.id === data.id ? 12 : 6,
        shadowOffsetY: 1
      },
      draggable: true
    }
  })
  const links = data.edges.map((e) => ({
    source: e.source,
    target: e.target,
    lineStyle: { curveness: 0.22 }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => (p.data?.status ? `${p.data.name}<br/>状态：${p.data.statusCn}` : '')
    },
    legend: {
      show: false
    },
    series: [
      {
        type: 'graph',
        layout: 'none',
        data: nodes,
        links,
        roam: true,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 12,
        lineStyle: { color: '#cbd5e1', width: 1.6, opacity: 0.95 },
        emphasis: { focus: 'adjacency' },
        focusNodeAdjacency: true,
        animationDurationUpdate: 300
      }
    ]
  }
}

const fetchDag = async () => {
  loading.value = true
  try {
    const { data } = await getDag(taskId.value)
    dag.value = data
    chartOptions.value = buildOption(data)
  } finally {
    loading.value = false
  }
}

// 不再提供右键菜单

const doRun = async () => {
  if (!detail.value?.taskId) return
  await runTask(detail.value.taskId)
  ElMessage.success('已提交执行')
  fetchDag()
}
const doStop = async () => {
  if (!detail.value?.taskId) return
  await cancelTask(detail.value.taskId)
  ElMessage.success('已停止')
  fetchDag()
}
const doReset = async () => {
  if (!resetDialog.date) return ElMessage.warning('请选择开始日期')
  if (!detail.value?.taskId) return
  await resetTask(detail.value.taskId, resetDialog.date)
  ElMessage.success('已提交重置')
  resetDialog.visible = false
  fetchDag()
}
const openReset = () => {
  resetDialog.visible = true
  resetDialog.date = ''
}

const quit = () => {
  detailDialog.visible = false
}
// 详情由双击节点打开

const onSearch = () => fetchDag()

const afterInit = (chart: any) => {
  chart.on('dblclick', async (params: any) => {
    const id = params?.data?.id || params?.name
    if (!id) return
    const res = await getTaskDetailInfo(id)
    detail.value = res.data
    detailDialog.visible = true
  })
  chart.on('graphRoam', () => {
    const zoom = chart.getModel().getSeriesByIndex(0).option.zoom || 1
    chart.setOption({
      series: [{ label: { rich: { name: { fontSize: 12 * zoom } } } }]
    })
  })
}

onMounted(async () => {
  await nextTick()
})

// ECharts 无需手动销毁，组件内部已处理
</script>

<template>
  <ContentWrap title="任务DAG图">
    <div class="flex gap-8 items-center mb-12">
      <ElInput v-model="taskId" placeholder="请输入任务名" clearable class="max-w-360" />
      <ElButton :disabled="!taskId" type="primary" :loading="loading" @click="onSearch"
      >查看DAG图</ElButton
      >
    </div>
    <Echart :options="chartOptions" height="560px" :afterInit="afterInit" />
  </ContentWrap>

  <!-- 重置对话框 -->
  <ElDialog v-model="resetDialog.visible" title="重置任务" width="420px">
    <ElDatePicker v-model="resetDialog.date" type="date" value-format="YYYY-MM-DD" />
    <template #footer>
      <ElButton @click="resetDialog.visible = false">取消</ElButton>
      <ElButton type="primary" @click="doReset">确定</ElButton>
    </template>
  </ElDialog>

  <!-- 详情对话框 -->
  <ElDialog v-model="detailDialog.visible" title="任务详情" width="720px">
    <div v-if="detail">
      <div class="grid grid-cols-2 gap-8 text-sm mb-8">
        <div>任务名称：{{ detail.taskId }}</div>
        <div>状态：{{ detail.status }}</div>
        <div>负责人：{{ detail.owner }}</div>
        <div>提交时间：{{ detail.createTime }}</div>
        <div>更新时间：{{ detail.updateTime }}</div>
        <div>耗时：{{ detail.duration || '-' }}</div>
      </div>
      <div class="text-sm">
        <div class="font-600 mb-6">日志</div>
        <div class="max-h-260 overflow-auto border rounded p-8 leading-6">
          <div v-for="(log, i) in detail.logs || []" :key="i">
            <span
                :class="{
                'text-green-600': String(log).includes('INFO'),
                'text-red-500': String(log).includes('ERROR'),
                'text-orange-500': String(log).includes('WARN')
              }"
            >{{ log }}</span
            >
          </div>
        </div>
      </div>
      <div class="mt-10 flex justify-end gap-8">
        <ElButton type="success" @click="doRun">执行任务</ElButton>
        <ElButton type="warning" @click="doStop">停止任务</ElButton>
        <ElButton type="primary" @click="openReset">重置任务</ElButton>
        <ElButton type="info" @click="quit">退出</ElButton>
      </div>
    </div>
  </ElDialog>
</template>
