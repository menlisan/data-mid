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

<template>
  <div class="p-2">
    <ElCard shadow="hover">
      <template #header>
        <div class="mb-4">
          <!-- 筛选区域，与手动任务风格对齐 -->
          <div class="grid gap-12 md:grid-cols-4 sm:grid-cols-2 grid-cols-1 mb-6 mt-2">
            <ElInput v-model="queryForm.name" placeholder="任务名称（模糊）" clearable />
            <ElSelect v-model="queryForm.status" placeholder="任务状态" clearable>
              <ElOption label="运行中" value="running" />
              <ElOption label="停止" value="stopped" />
              <ElOption label="异常" value="error" />
              <ElOption label="等待" value="pending" />
              <ElOption label="完成" value="done" />
            </ElSelect>
            <div>
              <ElButton type="primary" @click="onSearch">搜索</ElButton>
              <ElButton @click="onReset">重置</ElButton>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="space-x-8">
              <ElButton type="primary" @click="fetchList">刷新</ElButton>
              <ElTooltip
                content="选择非运行中任务可启用"
                :disabled="selection.length > 0 && canRunBatch"
              >
                <div class="inline-block">
                  <ElButton
                    type="success"
                    :disabled="selection.length === 0 || !canRunBatch"
                    @click="batchEnable"
                    >批量启用</ElButton
                  >
                </div>
              </ElTooltip>
              <ElTooltip
                content="仅运行中任务可停止"
                :disabled="selection.length > 0 && canStopBatch"
              >
                <div class="inline-block">
                  <ElButton
                    type="warning"
                    :disabled="selection.length === 0 || !canStopBatch"
                    @click="batchStop"
                    >批量停止</ElButton
                  >
                </div>
              </ElTooltip>
              <ElButton type="primary" @click="openBatchReset">批量重置</ElButton>
            </div>
          </div>
        </div>
      </template>

      <div
        class="inline-flex rounded-md border border-gray-300 bg-white overflow-hidden select-none mb-4"
      >
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

      <ElTable
        :data="list"
        v-loading="loading"
        size="large"
        @selection-change="onSelectionChange"
        class="w-full"
        row-key="id"
      >
        <ElTableColumn type="selection" width="42" />
        <ElTableColumn prop="id" label="任务ID" width="90" />
        <ElTableColumn prop="name" label="任务名称" min-width="200" />
        <ElTableColumn label="状态" width="110">
          <template #default="scope">
            <ElTag v-if="scope && scope.row" :type="statusType[scope.row.status]">
              {{ statusText[scope.row.status] }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="submitTime" label="提交时间" min-width="160" />
        <ElTableColumn prop="executeTime" label="执行时间" min-width="160" />
        <ElTableColumn label="耗时" width="120">
          <template #default="scope">
            <span v-if="scope && scope.row && scope.row.durationMs"
              >{{ Math.round(scope.row.durationMs / 1000) }}s</span
            >
            <span v-else>--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="owner" label="负责人" width="120" />
        <ElTableColumn label="操作" width="360" fixed="right">
          <template #default="scope">
            <ElTooltip
              :content="canRun(scope.row) ? '执行任务' : '运行中的任务不可再次执行'"
              placement="top"
            >
              <div class="inline-block">
                <ElButton
                  link
                  type="success"
                  :disabled="!canRun(scope.row)"
                  @click="openExec(scope.row)"
                  >执行</ElButton
                >
              </div>
            </ElTooltip>
            <ElTooltip
              :content="canStop(scope.row) ? '停止任务' : '仅运行中任务可停止'"
              placement="top"
            >
              <div class="inline-block">
                <ElButton
                  link
                  type="warning"
                  :disabled="!canStop(scope.row)"
                  @click="openStop(scope.row)"
                  >停止</ElButton
                >
              </div>
            </ElTooltip>
            <ElButton link type="primary" @click="openReset(scope.row)">重置</ElButton>
            <ElButton link type="info" @click="openDetail(scope.row)">详情</ElButton>
            <ElButton link type="primary" @click="openDag(scope.row)">依赖</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="flex justify-end mt-12">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="prev, pager, next, jumper, sizes, total"
          @current-change="fetchList"
          @size-change="
            () => {
              page.value = 1
              fetchList()
            }
          "
        />
      </div>
    </ElCard>

    <!-- 执行对话框 -->
    <ElDialog v-model="execDialog.visible" title="执行任务" width="420px">
      <ElDatePicker v-model="execDialog.date" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
      <template #footer>
        <ElButton @click="execDialog.visible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmExec">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 重置对话框 -->
    <ElDialog v-model="resetDialog.visible" title="重置任务" width="420px">
      <ElDatePicker v-model="resetDialog.date" type="date" value-format="YYYY-MM-DD" />
      <template #footer>
        <ElButton @click="resetDialog.visible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmReset">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 批量重置对话框 -->
    <ElDialog v-model="batchResetDialog.visible" title="批量重置" width="420px">
      <ElDatePicker v-model="batchResetDialog.date" type="date" value-format="YYYY-MM-DD" />
      <template #footer>
        <ElButton @click="batchResetDialog.visible = false">取消</ElButton>
        <ElButton type="primary" @click="doBatchReset">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 详情对话框 -->
    <ElDialog v-model="detailDialog.visible" title="任务详情" width="720px">
      <div v-if="detail?.task">
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
          <ElDescriptions :column="3" border>
            <ElDescriptionsItem label="任务名称">
              <span class="font-medium">{{ detail.name }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="负责人">
              <span class="font-medium">{{ detail.owner }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态">
              <ElTag :type="statusType[detail.status]">
                {{ statusText[detail.status] }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="执行日期">
              {{ detail.executeDate }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="提交时间">
              {{ detail.submitTime }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="执行时间">
              {{ detail.executeTime }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="耗时">
              {{ detail.durationMs ? Math.round(detail.durationMs / 1000) + 's' : '--' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :span="2" label="描述">
              {{ detail.description }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
        <div class="grid grid-cols-2 gap-8 text-sm mb-8">
          <div>任务ID：{{ detail.task?.id }}</div>
          <div>任务名称：{{ detail.task?.name }}</div>
          <div>状态：{{ detail.task?.status }}</div>
          <div>负责人：{{ detail.task?.owner }}</div>
          <div>提交时间：{{ detail.task?.submitTime }}</div>
          <div>执行时间：{{ detail.task?.executeTime || '-' }}</div>
          <div
            >耗时：{{
              detail.task?.durationMs
                ? Math.round((detail.task?.durationMs || 0) / 1000) + 's'
                : '-'
            }}</div
          >
        </div>
        <div class="text-sm">
          <div class="font-600 mb-6">日志</div>
          <ElScrollbar height="260px">
            <div class="border rounded p-8 leading-6">
              <div v-for="(log, i) in detail?.logs || []" :key="i">{{ log }}</div>
            </div>
          </ElScrollbar>
        </div>
        <div class="mt-10 flex justify-end gap-8">
          <ElButton type="primary" @click="goDag">查看DAG</ElButton>
          <ElButton type="success" @click="onFillLogs">日志增补</ElButton>
          <ElButton @click="detailDialog.visible = false">退出</ElButton>
        </div>
      </div>
    </ElDialog>

    <!-- 依赖DAG弹窗 -->
    <ElDialog v-model="dagDialog.visible" title="任务依赖图" width="80%">
      <Suspense>
        <component
          :is="defineAsyncComponent(() => import('@/views/Lineage/Dag.vue'))"
          :key="dagDialog.taskId"
          :initTaskId="dagDialog.taskId"
        />
      </Suspense>
    </ElDialog>
  </div>
</template>
