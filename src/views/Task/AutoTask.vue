<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <ElCard shadow="never" class="mb-6 border-0 bg-white">
      <div class="space-y-4">
        <!-- 搜索筛选 -->
        <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2 grid-cols-1">
          <ElInput v-model="queryForm.name" placeholder="搜索任务名称..." clearable class="w-full">
            <template #prefix>
              <svg
                class="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </template>
          </ElInput>

          <ElSelect v-model="queryForm.status" placeholder="选择状态" clearable class="w-full">
            <ElOption label="运行中" value="running" />
            <ElOption label="停止" value="stopped" />
            <ElOption label="异常" value="error" />
            <ElOption label="等待" value="pending" />
            <ElOption label="完成" value="done" />
          </ElSelect>

          <div class="flex gap-2">
            <ElButton type="primary" @click="onSearch" class="flex-1"> 搜索 </ElButton>
            <ElButton @click="onReset" class="flex-1"> 重置 </ElButton>
          </div>
        </div>
      </div>
      <!-- 操作按钮 -->
      <div class="flex items-center justify-between mb-1 mt-6 pb-4 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <ElButton
            type="primary"
            @click="fetchList"
            class="!bg-blue-600 !border-blue-600 hover:!bg-blue-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            刷新
          </ElButton>

          <ElTooltip
            content="选择非运行中任务可启用"
            :disabled="selection.length > 0 && canRunBatch"
          >
            <div>
              <ElButton
                type="success"
                :disabled="selection.length === 0 || !canRunBatch"
                @click="batchEnable"
                class="!bg-green-600 !border-green-600 hover:!bg-green-700"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 6h6"
                  />
                </svg>
                批量启用 ({{ selection.length }})
              </ElButton>
            </div>
          </ElTooltip>

          <ElTooltip content="仅运行中任务可停止" :disabled="selection.length > 0 && canStopBatch">
            <div>
              <ElButton
                type="warning"
                :disabled="selection.length === 0 || !canStopBatch"
                @click="batchStop"
                class="!bg-orange-500 !border-orange-500 hover:!bg-orange-600"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 10h6v4H9z"
                  />
                </svg>
                批量停止 ({{ selection.length }})
              </ElButton>
            </div>
          </ElTooltip>

          <ElButton
            type="primary"
            @click="openBatchReset"
            class="!bg-purple-600 !border-purple-600 hover:!bg-purple-700"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            批量重置 ({{ selection.length }})
          </ElButton>
        </div>
      </div>
      <!-- 状态快速筛选 -->
      <div class="flex items-center justify-between">
        <div class="flex bg-gray-100 rounded-lg p-1 mb-2">
          <ElButton
            v-for="(label, status) in statusText"
            :key="status"
            size="small"
            @click="onStatusFilter(status as string)"
            :class="[
              '!m-0 min-w-[48px] text-xs px-3 py-1 cursor-pointer transition-colors duration-150 first:rounded-l-md last:rounded-r-md border-r border-gray-300 last:border-r-0',
              queryForm.status === status
                ? 'bg-blue-400 text-white hover:bg-blue-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
            ]"
          >
            {{ label }}
          </ElButton>
        </div>
        <div class="text-sm text-gray-500"> 共 {{ total }} 条记录 </div>
      </div>
      <!-- 表格 -->
      <ElTable
        :data="list"
        v-loading="loading"
        @selection-change="onSelectionChange"
        row-key="id"
        class="w-full"
        :header-cell-style="{
          backgroundColor: '#f8fafc',
          color: '#374151',
          fontWeight: '600',
          borderBottom: '1px solid #e5e7eb'
        }"
        :row-style="{ borderBottom: '1px solid #f3f4f6' }"
      >
        <ElTableColumn type="selection" width="50" />

        <ElTableColumn prop="id" label="任务ID" width="100">
          <template #default="scope">
            <div class="font-mono text-sm text-gray-600">{{ scope.row.id }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="name" label="任务名称" min-width="200">
          <template #default="scope">
            <div class="font-medium text-gray-900">{{ scope.row.name }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="任务状态" width="120">
          <template #default="scope">
            <ElTag
              :type="statusType[scope.row.status]"
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                {
                  'bg-green-100 text-green-800 border-green-200': scope.row.status === 'running',
                  'bg-blue-100 text-blue-800 border-blue-200': scope.row.status === 'pending',
                  'bg-red-100 text-red-800 border-red-200': scope.row.status === 'error',
                  'bg-gray-100 text-gray-800 border-gray-200': scope.row.status === 'stopped',
                  'bg-purple-100 text-purple-800 border-purple-200': scope.row.status === 'done'
                }
              ]"
            >
              <div class="flex items-center gap-1">
                <div
                  :class="[
                    'w-2 h-2 rounded-full',
                    {
                      'bg-green-500 animate-pulse': scope.row.status === 'running',
                      'bg-blue-500': scope.row.status === 'pending',
                      'bg-red-500': scope.row.status === 'error',
                      'bg-gray-500': scope.row.status === 'stopped',
                      'bg-purple-500': scope.row.status === 'done'
                    }
                  ]"
                ></div>
                {{ statusText[scope.row.status] }}
              </div>
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="submitTime" label="提交时间" min-width="160">
          <template #default="scope">
            <div class="text-gray-600 text-sm">{{ scope.row.submitTime }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="executeTime" label="执行时间" min-width="160">
          <template #default="scope">
            <div class="text-gray-600 text-sm">{{ scope.row.executeTime || '--' }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="耗时" width="100">
          <template #default="scope">
            <div class="text-gray-600 text-sm font-mono">
              {{ scope.row.durationMs ? Math.round(scope.row.durationMs / 1000) + 's' : '--' }}
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="owner" label="负责人" width="120">
          <template #default="scope">
            <div class="text-gray-700 font-medium">{{ scope.row.owner }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="320" fixed="right">
          <template #default="scope">
            <div class="flex items-center gap-2">
              <ElTooltip
                :content="canRun(scope.row) ? '执行任务' : '运行中的任务不可再次执行'"
                placement="top"
              >
                <ElButton
                  link
                  type="success"
                  :disabled="!canRun(scope.row)"
                  @click="openExec(scope.row)"
                  size="small"
                  class="!text-green-600 hover:!text-green-700"
                >
                  执行
                </ElButton>
              </ElTooltip>

              <ElTooltip
                :content="canStop(scope.row) ? '停止任务' : '仅运行中任务可停止'"
                placement="top"
              >
                <ElButton
                  link
                  type="warning"
                  :disabled="!canStop(scope.row)"
                  @click="openStop(scope.row)"
                  size="small"
                  class="!text-orange-600 hover:!text-orange-700"
                >
                  停止
                </ElButton>
              </ElTooltip>

              <ElButton
                link
                type="primary"
                @click="openReset(scope.row)"
                size="small"
                class="!text-purple-600 hover:!text-purple-700"
              >
                重置
              </ElButton>

              <ElButton
                link
                type="info"
                @click="openDetail(scope.row)"
                size="small"
                class="!text-blue-600 hover:!text-blue-700"
              >
                详情
              </ElButton>

              <ElButton
                link
                type="primary"
                @click="openDag(scope.row)"
                size="small"
                class="!text-indigo-600 hover:!text-indigo-700"
              >
                依赖
              </ElButton>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
        <div class="text-sm text-gray-500">
          显示第 {{ (page - 1) * pageSize + 1 }} - {{ Math.min(page * pageSize, total) }} 条， 共
          {{ total }} 条记录
        </div>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="prev, pager, next, jumper, sizes"
          @current-change="fetchList"
          @size-change="
            () => {
              page = 1
              fetchList()
            }
          "
          class="!bg-transparent"
        />
      </div>
    </ElCard>

    <!-- 执行对话框 -->
    <ElDialog
      v-model="execDialog.visible"
      title="执行任务"
      width="420px"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择执行时间</label>
          <ElDatePicker
            v-model="execDialog.date"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择执行时间"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="execDialog.visible = false">取消</ElButton>
          <ElButton type="primary" @click="confirmExec">确定</ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 重置对话框 -->
    <ElDialog
      v-model="resetDialog.visible"
      title="重置任务"
      width="420px"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择开始日期</label>
          <ElDatePicker
            v-model="resetDialog.date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="resetDialog.visible = false">取消</ElButton>
          <ElButton type="primary" @click="confirmReset">确定</ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 批量重置对话框 -->
    <ElDialog
      v-model="batchResetDialog.visible"
      title="批量重置"
      width="420px"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择开始日期</label>
          <ElDatePicker
            v-model="batchResetDialog.date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始日期"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="batchResetDialog.visible = false">取消</ElButton>
          <ElButton type="primary" @click="doBatchReset">确定</ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- 详情对话框 -->
    <ElDialog v-model="detailDialog.visible" title="任务详情" width="80%" align-center>
      <ElScrollbar height="80vh">
        <div v-if="detail?.task" class="space-y-6 p-5">
          <!-- 基本信息 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            <ElDescriptions :column="3" border>
              <ElDescriptionsItem label="任务ID">
                <span class="font-mono text-sm">{{ detail.task.id }}</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="任务名称">
                <span class="font-medium">{{ detail.task.name }}</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="状态">
                <ElTag :type="statusType[detail.task.status]">
                  {{ statusText[detail.task.status] }}
                </ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="负责人">
                <span class="font-medium">{{ detail.task.owner }}</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="提交时间">
                {{ detail.task.submitTime }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="执行时间">
                {{ detail.task.executeTime || '--' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="耗时">
                {{
                  detail.task.durationMs ? Math.round(detail.task.durationMs / 1000) + 's' : '--'
                }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>

          <!-- 执行日志 -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">执行日志</h3>
              <ElButton
                type="success"
                size="small"
                @click="onFillLogs"
                class="!bg-green-600 !border-green-600 hover:!bg-green-700"
              >
                日志增补
              </ElButton>
            </div>
            <div class="bg-gray-900 rounded-lg p-4">
              <ElScrollbar height="300px">
                <div class="text-sm font-mono leading-relaxed">
                  <div
                    v-for="(log, i) in detail?.logs || []"
                    :key="i"
                    class="py-1"
                    :class="{
                      'text-green-400': String(log).includes('INFO'),
                      'text-red-400': String(log).includes('ERROR'),
                      'text-yellow-400': String(log).includes('WARN'),
                      'text-gray-300':
                        !String(log).includes('INFO') &&
                        !String(log).includes('ERROR') &&
                        !String(log).includes('WARN')
                    }"
                  >
                    <span class="text-gray-500 mr-2">{{ String(i + 1).padStart(3, '0') }}.</span>
                    {{ log }}
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end gap-3 pt-4 border-t">
            <ElButton
              type="primary"
              @click="goDag"
              class="!bg-indigo-600 !border-indigo-600 hover:!bg-indigo-700"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              查看DAG
            </ElButton>
            <ElButton @click="detailDialog.visible = false">关闭</ElButton>
          </div>
        </div>
      </ElScrollbar>
    </ElDialog>

    <!-- 依赖DAG弹窗 -->
    <ElDialog
      v-model="dagDialog.visible"
      title="任务依赖图"
      width="90%"
      :close-on-click-modal="false"
      class="dag-dialog"
    >
      <div class="h-[600px]">
        <Suspense>
          <component
            :is="defineAsyncComponent(() => import('@/views/Lineage/Dag.vue'))"
            :key="dagDialog.taskId"
            :initTaskId="dagDialog.taskId"
          />
        </Suspense>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TaskAuto' })

import { ref, reactive, onMounted, defineAsyncComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  getAutoTaskList,
  executeAutoTask,
  stopAutoTask,
  resetAutoTask,
  getAutoTaskLogDetail,
  fillLogs,
  type AutoTaskItem,
  type AutoTaskStatus
} from '@/api/modules/autoTask'
import {
  ElCard,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
  ElPagination,
  ElDialog,
  ElDatePicker,
  ElScrollbar,
  ElMessage,
  ElMessageBox,
  ElDescriptionsItem,
  ElDescriptions
} from 'element-plus'

const router = useRouter()

const queryForm = reactive<{ name?: string; status?: AutoTaskStatus | '' }>({
  name: '',
  status: ''
})

const list = ref<AutoTaskItem[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const selection = ref<AutoTaskItem[]>([])

const statusText: Record<AutoTaskStatus, string> = {
  running: '运行中',
  pending: '等待',
  error: '异常',
  stopped: '停止',
  done: '完成'
}

const statusType: Record<AutoTaskStatus, any> = {
  running: 'success',
  pending: 'info',
  error: 'danger',
  stopped: 'warning',
  done: 'primary'
}

const fetchList = async () => {
  loading.value = true
  try {
    const { data } = await getAutoTaskList({
      name: queryForm.name || '',
      status: (queryForm.status as any) || '',
      page: page.value,
      pageSize: pageSize.value
    })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)

const onSearch = () => {
  page.value = 1
  fetchList()
}

const onReset = () => {
  queryForm.name = ''
  queryForm.status = ''
  page.value = 1
  fetchList()
}

const onSelectionChange = (rows: AutoTaskItem[]) => {
  selection.value = rows
}

// 与手动任务页一致的可操作性判断
const canRun = (row: AutoTaskItem) => row.status !== 'running'
const canStop = (row: AutoTaskItem) => row.status === 'running'
const canRunBatch = computed(() => selection.value.some((r) => canRun(r)))
const canStopBatch = computed(() => selection.value.some((r) => canStop(r)))

// 批量操作
const batchEnable = async () => {
  if (!selection.value.length) return ElMessage.warning('请选择任务')
  await Promise.all(selection.value.map((r) => executeAutoTask(r.id, new Date().toISOString())))
  ElMessage.success('批量启用成功')
  fetchList()
}

const batchStop = async () => {
  if (!selection.value.length) return ElMessage.warning('请选择任务')
  await ElMessageBox.confirm('确认停止所选任务吗？', '提示', { type: 'warning' })
  await Promise.all(selection.value.map((r) => stopAutoTask(r.id)))
  ElMessage.success('批量停止成功')
  fetchList()
}

// 批量重置
const batchResetDialog = reactive({ visible: false, date: '' })
const openBatchReset = () => {
  if (!selection.value.length) return ElMessage.warning('请选择任务')
  batchResetDialog.visible = true
  batchResetDialog.date = ''
}

const doBatchReset = async () => {
  if (!batchResetDialog.date) return ElMessage.warning('请选择开始日期')
  await Promise.all(selection.value.map((r) => resetAutoTask(r.id, batchResetDialog.date)))
  ElMessage.success('批量重置成功')
  batchResetDialog.visible = false
  fetchList()
}

// 单行操作
const execDialog = reactive({ visible: false, date: '', id: '' as string | number })
const openExec = (row: AutoTaskItem) => {
  execDialog.id = row.id
  execDialog.visible = true
  execDialog.date = ''
}

const confirmExec = async () => {
  if (!execDialog.date) return ElMessage.warning('请选择开始时间')
  await executeAutoTask(execDialog.id, execDialog.date)
  ElMessage.success('已提交执行')
  execDialog.visible = false
  fetchList()
}

const openStop = async (row: AutoTaskItem) => {
  await ElMessageBox.confirm(`确认停止任务「${row.name}」吗？`, '提示', { type: 'warning' })
  await stopAutoTask(row.id)
  ElMessage.success('已停止')
  fetchList()
}

const resetDialog = reactive({ visible: false, date: '', id: '' as string | number })
const openReset = (row: AutoTaskItem) => {
  resetDialog.id = row.id
  resetDialog.visible = true
  resetDialog.date = ''
}

const confirmReset = async () => {
  if (!resetDialog.date) return ElMessage.warning('请选择开始日期')
  await resetAutoTask(resetDialog.id, resetDialog.date)
  ElMessage.success('已提交重置')
  resetDialog.visible = false
  fetchList()
}

// 详情
const detailDialog = reactive({ visible: false })
const detail = ref<{ task?: Partial<AutoTaskItem>; logs?: string[] } | null>(null)
const openDetail = async (row: AutoTaskItem) => {
  const { data } = await getAutoTaskLogDetail(row.id)
  detail.value = data
  detailDialog.visible = true
}

const onFillLogs = async () => {
  if (!detail.value?.task?.id) return
  await fillLogs(detail.value.task.id)
  ElMessage.success('已提交日志增补')
}

const goDag = () => {
  const id = detail.value?.task?.name || ''
  router.push({ path: '/lineage/dag', query: { taskId: String(id) } })
}

// 依赖图弹窗
const dagDialog = reactive({ visible: false, taskId: '' as string })
const openDag = (row: AutoTaskItem) => {
  dagDialog.taskId = String(row.name || row.id)
  dagDialog.visible = true
}

// 状态快捷筛选，与手动任务页一致
const onStatusFilter = (status: string) => {
  const mapped = (status === 'failed' ? 'error' : status) as AutoTaskStatus | ''
  queryForm.status = mapped
  page.value = 1
  fetchList()
}
</script>

<style scoped>
/* 自定义滚动条样式 */
:deep(.el-scrollbar__bar) {
  opacity: 0.6;
}

:deep(.el-scrollbar__thumb) {
  background-color: #4b5563;
  border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
  background-color: #6b7280;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header-wrapper) {
  border-radius: 8px 8px 0 0;
}

/* 分页样式优化 */
:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  background-color: white;
  border: 1px solid #e5e7eb;
}

:deep(.el-pagination .btn-next:hover),
:deep(.el-pagination .btn-prev:hover) {
  color: #3b82f6;
}

/* DAG对话框样式 */
:deep(.dag-dialog .el-dialog__body) {
  padding: 0;
}
</style>
