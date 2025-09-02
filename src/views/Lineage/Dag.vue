<script setup lang="ts">
defineOptions({ name: 'LineageDag' })

import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElInput, ElButton, ElDialog, ElDatePicker, ElMessage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import * as dagre from 'dagre'
import {
  getDag,
  runTask,
  cancelTask,
  resetTask,
  getTaskDetailInfo,
  type DagData
} from '@/api/modules/dag'

const props = defineProps<{ initTaskId?: string }>()

const taskId = ref('task_main')
const loading = ref(false)
const dag = ref<DagData | null>(null)

// SVG相关状态
const svgRef = ref<SVGElement>()
const containerRef = ref<HTMLElement>()
const transform = ref({ x: 0, y: 0, scale: 1 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 在现有的 ref 声明后添加
const hoveredNodeId = ref<string | null>(null)

const statusConfig = {
  running: { color: '#10b981', bgColor: '#ecfdf5', borderColor: '#10b981', text: '运行中' },
  pending: { color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#3b82f6', text: '等待' },
  error: { color: '#ef4444', bgColor: '#fef2f2', borderColor: '#ef4444', text: '异常' },
  stopped: { color: '#6b7280', bgColor: '#f9fafb', borderColor: '#6b7280', text: '停止' },
  done: { color: '#8b5cf6', bgColor: '#f3f4f6', borderColor: '#8b5cf6', text: '完成' }
}

const resetDialog = reactive({ visible: false, date: '' })
const detailDialog = reactive({ visible: false })
const detail = ref<any>(null)

// 计算布局
const layoutData = computed(() => {
  if (!dag.value) return { nodes: [], edges: [] }

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    edgesep: 20,
    ranksep: 120,
    ranker: 'network-simplex'
  })
  g.setDefaultEdgeLabel(() => ({}))

  // 设置节点尺寸
  dag.value.nodes.forEach((n) => {
    const textLength = n.id.length
    const width = Math.max(180, textLength * 8 + 60)
    g.setNode(n.id, { width, height: 60 })
  })

  dag.value.edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  const nodes = dag.value.nodes.map((n) => {
    const pos = g.node(n.id)
    const config = statusConfig[n.status as keyof typeof statusConfig] || statusConfig.stopped

    return {
      id: n.id,
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
      status: n.status,
      config,
      isHighlighted: n.id === dag.value?.id
    }
  })

  const edges = dag.value.edges.map((e) => {
    const sourceNode = g.node(e.source)
    const targetNode = g.node(e.target)

    return {
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      sourceX: sourceNode.x + sourceNode.width / 2,
      sourceY: sourceNode.y,
      targetX: targetNode.x - targetNode.width / 2,
      targetY: targetNode.y
    }
  })

  return { nodes, edges }
})

// SVG视图框
const viewBox = computed(() => {
  if (layoutData.value.nodes.length === 0) return '0 0 800 600'

  const nodes = layoutData.value.nodes
  const minX = Math.min(...nodes.map((n) => n.x - n.width / 2)) - 50
  const maxX = Math.max(...nodes.map((n) => n.x + n.width / 2)) + 50
  const minY = Math.min(...nodes.map((n) => n.y - n.height / 2)) - 50
  const maxY = Math.max(...nodes.map((n) => n.y + n.height / 2)) + 50

  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
})

// 生成路径
const getEdgePath = (edge: any) => {
  const { sourceX, sourceY, targetX, targetY } = edge
  const midX = (sourceX + targetX) / 2

  return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`
}

// 事件处理
const handleNodeDoubleClick = async (nodeId: string) => {
  try {
    const res = await getTaskDetailInfo(nodeId)
    detail.value = res.data
    detailDialog.visible = true
  } catch (error) {
    ElMessage.error('获取任务详情失败')
  }
}

// 在现有函数后添加
const handleNodeMouseEnter = (nodeId: string) => {
  hoveredNodeId.value = nodeId
}

const handleNodeMouseLeave = () => {
  hoveredNodeId.value = null
}

const handleMouseDown = (event: MouseEvent) => {
  if (event.target === svgRef.value) {
    isDragging.value = true
    dragStart.value = { x: event.clientX, y: event.clientY }
    event.preventDefault()
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y

    transform.value.x += deltaX
    transform.value.y += deltaY

    dragStart.value = { x: event.clientX, y: event.clientY }
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(3, transform.value.scale * delta))

  if (newScale !== transform.value.scale) {
    const rect = containerRef.value?.getBoundingClientRect()
    if (rect) {
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      transform.value.x =
        centerX - (centerX - transform.value.x) * (newScale / transform.value.scale)
      transform.value.y =
        centerY - (centerY - transform.value.y) * (newScale / transform.value.scale)
      transform.value.scale = newScale
    }
  }
}

const resetView = () => {
  transform.value = { x: 0, y: 0, scale: 1 }
}

const fetchDag = async () => {
  loading.value = true
  try {
    const { data } = await getDag(taskId.value)
    dag.value = data
  } finally {
    loading.value = false
  }
}

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

const onSearch = () => fetchDag()

onMounted(async () => {
  await nextTick()

  // 添加全局事件监听
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  // 如果外部传入了初始任务ID，则自动加载
  if (props.initTaskId) {
    taskId.value = props.initTaskId
    await fetchDag()
  }
})
</script>

<template>
  <ContentWrap title="任务DAG图">
    <div class="flex gap-4 items-center mb-6">
      <ElInput v-model="taskId" placeholder="请输入任务名" clearable class="max-w-80" />
      <ElButton :disabled="!taskId" type="primary" :loading="loading" @click="onSearch">
        查看DAG图
      </ElButton>
      <ElButton @click="resetView"> 重置视图 </ElButton>
    </div>

    <div
      ref="containerRef"
      class="relative w-full h-[480px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-sm"
      @wheel="handleWheel"
    >
      <svg
        ref="svgRef"
        class="w-full h-full cursor-grab active:cursor-grabbing"
        :viewBox="viewBox"
        @mousedown="handleMouseDown"
      >
        <defs>
          渐变定义
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color: #ffffff; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #f8fafc; stop-opacity: 1" />
          </linearGradient>

          阴影滤镜
          <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="2"
              flood-color="rgba(0,0,0,0.1)"
              flood-opacity="1"
              stdDeviation="3"
            />
          </filter>

          箭头标记
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>

        <g :transform="`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`">
          连线
          <g class="edges">
            <path
              v-for="edge in layoutData.edges"
              :key="edge.id"
              :d="getEdgePath(edge)"
              stroke="#64748b"
              stroke-width="2"
              fill="none"
              marker-end="url(#arrowhead)"
              class="transition-all duration-200 hover:stroke-blue-500"
              :class="{
                'stroke-3': hoveredNodeId === edge.source || hoveredNodeId === edge.target
              }"
            />
          </g>

          节点
          <g
            v-for="node in layoutData.nodes"
            :key="node.id"
            :transform="`translate(${node.x - node.width / 2}, ${node.y - node.height / 2}) scale(${hoveredNodeId === node.id ? 1.05 : 1})`"
            class="cursor-pointer transition-transform duration-200 ease-out"
            @dblclick="handleNodeDoubleClick(node.id)"
            @mouseenter="handleNodeMouseEnter(node.id)"
            @mouseleave="handleNodeMouseLeave"
          >
            节点背景
            <rect
              :width="node.width"
              :height="node.height"
              rx="12"
              ry="12"
              :fill="node.isHighlighted ? 'url(#nodeGradient)' : 'white'"
              :stroke="node.isHighlighted ? '#10b981' : node.config.borderColor"
              :stroke-width="node.isHighlighted ? 3 : 2"
              filter="url(#nodeShadow)"
              class="transition-all duration-200"
            />

            状态指示器
            <circle
              :cx="node.width - 20"
              :cy="20"
              r="6"
              :fill="node.config.color"
              class="animate-pulse"
              v-if="node.status === 'running'"
            />
            <circle :cx="node.width - 20" :cy="20" r="6" :fill="node.config.color" v-else />

            节点文本
            <text
              :x="node.width / 2"
              :y="node.height / 2 - 8"
              text-anchor="middle"
              dominant-baseline="middle"
              class="fill-slate-800 text-sm font-semibold pointer-events-none"
              :font-size="Math.max(12, 14 * transform.scale)"
            >
              {{ node.id }}
            </text>

            状态文本
            <text
              :x="node.width / 2"
              :y="node.height / 2 + 12"
              text-anchor="middle"
              dominant-baseline="middle"
              :class="`fill-${node.config.color.replace('#', '')} text-xs pointer-events-none`"
              :font-size="Math.max(10, 12 * transform.scale)"
            >
              {{ node.config.text }}
            </text>

            高亮边框
            <rect
              v-if="node.isHighlighted"
              :width="node.width + 6"
              :height="node.height + 6"
              :x="-3"
              :y="-3"
              rx="15"
              ry="15"
              fill="none"
              stroke="#10b981"
              stroke-width="2"
              stroke-dasharray="5,5"
              class="animate-pulse pointer-events-none"
            />
          </g>
        </g>
      </svg>

      缩放控制
      <div class="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          @click="transform.scale = Math.min(3, transform.scale * 1.2)"
          class="w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-slate-600 hover:text-slate-800"
        >
          +
        </button>
        <button
          @click="transform.scale = Math.max(0.1, transform.scale * 0.8)"
          class="w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-slate-600 hover:text-slate-800"
        >
          −
        </button>
      </div>

      缩放比例显示
      <div
        class="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-lg shadow-md text-sm text-slate-600"
      >
        {{ Math.round(transform.scale * 100) }}%
      </div>
    </div>
  </ContentWrap>

  <ElDialog v-model="resetDialog.visible" title="重置任务" width="420px">
    <ElDatePicker v-model="resetDialog.date" type="date" value-format="YYYY-MM-DD" class="w-full" />
    <template #footer>
      <ElButton @click="resetDialog.visible = false">取消</ElButton>
      <ElButton type="primary" @click="doReset">确定</ElButton>
    </template>
  </ElDialog>

  <ElDialog v-model="detailDialog.visible" title="任务详情" width="720px">
    <div v-if="detail" class="space-y-6">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="flex justify-between">
          <span class="text-slate-600">任务名称：</span>
          <span class="font-medium">{{ detail.taskId }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600">状态：</span>
          <span
            class="px-2 py-1 rounded-full text-xs font-medium"
            :class="{
              'bg-green-100 text-green-800': detail.status === 'running',
              'bg-blue-100 text-blue-800': detail.status === 'pending',
              'bg-red-100 text-red-800': detail.status === 'error',
              'bg-gray-100 text-gray-800': detail.status === 'stopped',
              'bg-purple-100 text-purple-800': detail.status === 'done'
            }"
          >
            {{ statusConfig[detail.status as keyof typeof statusConfig]?.text || detail.status }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600">负责人：</span>
          <span class="font-medium">{{ detail.owner }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600">提交时间：</span>
          <span class="font-medium">{{ detail.createTime }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600">更新时间：</span>
          <span class="font-medium">{{ detail.updateTime }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600">耗时：</span>
          <span class="font-medium">{{ detail.duration || '-' }}</span>
        </div>
      </div>

      <div>
        <h4 class="font-semibold mb-3 text-slate-800">执行日志</h4>
        <div class="max-h-64 overflow-auto bg-slate-900 rounded-lg p-4 text-sm font-mono">
          <div
            v-for="(log, i) in detail.logs || []"
            :key="i"
            class="leading-relaxed"
            :class="{
              'text-green-400': String(log).includes('INFO'),
              'text-red-400': String(log).includes('ERROR'),
              'text-yellow-400': String(log).includes('WARN'),
              'text-slate-300':
                !String(log).includes('INFO') &&
                !String(log).includes('ERROR') &&
                !String(log).includes('WARN')
            }"
          >
            {{ log }}
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <ElButton type="success" @click="doRun">执行任务</ElButton>
        <ElButton type="warning" @click="doStop">停止任务</ElButton>
        <ElButton type="primary" @click="openReset">重置任务</ElButton>
        <ElButton @click="quit">关闭</ElButton>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
.cursor-grab {
  cursor: grab;
}

.cursor-grab:active {
  cursor: grabbing;
}

/* 自定义滚动条 */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.stroke-3 {
  stroke-width: 3;
}
</style>
