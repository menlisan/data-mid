<template>
  <div class="p-2 bg-gray-50 min-h-screen">
    <ElCard shadow="never" class="mb-5 border-0 bg-white">
      <div class="space-y-4">
        <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2 grid-cols-1">
          <ElInput v-model="filters.name" placeholder="搜索任务名称..." clearable class="w-full">
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

          <ElSelect v-model="filters.status" placeholder="选择状态" clearable class="w-full">
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
      <div class="flex items-center justify-between mb-6 mt-6 pb-4 border-b border-gray-100">
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
                @click="onBatchRun"
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
                @click="onBatchStop"
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
        </div>
        <div class="text-sm text-gray-500"> 共 {{ pagination.total }} 条记录 </div>
      </div>

      <ElTable
        :data="list"
        v-loading="loading"
        @selection-change="setSelection"
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

        <ElTableColumn prop="name" label="任务名称" min-width="180">
          <template #default="scope">
            <div class="font-medium text-gray-900">{{ scope.row.name }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="executeDate" label="执行日期" width="120">
          <template #default="scope">
            <div class="text-gray-600">{{ scope.row.executeDate }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="任务状态" width="100">
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
            <div class="text-gray-600 text-sm font-mono">
              {{ scope.row.durationMs ? Math.round(scope.row.durationMs / 1000) + 's' : '--' }}
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="耗时" width="80">
          <template #default="scope">
            <div class="text-gray-600 text-sm font-mono">
              {{ scope.row.durationMs ? Math.round(scope.row.durationMs / 1000) + 's' : '--' }}
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn prop="owner" label="负责人" width="100">
          <template #default="scope">
            <div class="text-gray-700 font-medium">{{ scope.row.owner }}</div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="280" fixed="right">
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
                  @click="runOne(scope.row)"
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
                  @click="stopOne(scope.row)"
                  size="small"
                  class="!text-orange-600 hover:!text-orange-700"
                >
                  停止
                </ElButton>
              </ElTooltip>

              <ElButton
                link
                type="primary"
                @click="openDetail(scope.row)"
                size="small"
                class="!text-blue-600 hover:!text-blue-700"
              >
                详情
              </ElButton>

              <ElButton
                link
                type="info"
                @click="openReset(scope.row)"
                size="small"
                class="!text-gray-600 hover:!text-gray-700"
              >
                重置
              </ElButton>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
        <div class="text-sm text-gray-500">
          显示第 {{ (pagination.page - 1) * pagination.pageSize + 1 }} -
          {{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} 条， 共
          {{ pagination.total }} 条记录
        </div>
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="prev, pager, next, jumper, sizes"
          @current-change="fetchList"
          @size-change="
            () => {
              pagination.page = 1
              fetchList()
            }
          "
          class="!bg-transparent"
        />
      </div>
    </ElCard>

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

    <ElDialog v-model="detailDialog.visible" title="任务详情" width="80%" align-center>
      <ElScrollbar height="80vh">
        <div v-if="detail" class="space-y-6 p-5">
          <div class="bg-gray-50 rounded-lg p-2">
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
                {{ detail.executeTime || '--' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="耗时">
                {{ detail.durationMs ? Math.round(detail.durationMs / 1000) + 's' : '--' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem :span="2" label="描述">
                {{ detail.description || '—' }}
              </ElDescriptionsItem>
            </ElDescriptions>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">执行日志</h3>
            <div class="bg-gray-900 rounded-lg p-4">
              <ElScrollbar height="300px">
                <div class="text-sm font-mono leading-relaxed">
                  <div
                    v-for="(log, i) in logs"
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
        </div>
      </ElScrollbar>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'TaskManual' })

import { computed, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  ElCard,
  ElTable,
  ElTableColumn,
  ElButton,
  ElTooltip,
  ElPagination,
  ElDialog,
  ElDescriptions,
  ElDescriptionsItem,
  ElScrollbar,
  ElTag,
  ElInput,
  ElDatePicker,
  ElMessage,
  ElMessageBox,
  ElSelect,
  ElOption
} from 'element-plus'
import { useManualTaskStoreWithOut } from '@/store/modules/manualTask'

const store = useManualTaskStoreWithOut()
const { filters, pagination, list, loading, selection, detail, logs } = storeToRefs(store)
const {
  fetchList,
  setSelection,
  canRun,
  canStop,
  runSelected,
  stopSelected,
  resetSelected,
  fetchDetail,
  fetchLogs
} = store

const statusText: Record<string, string> = {
  running: '运行中',
  stopped: '停止',
  error: '异常',
  pending: '等待',
  done: '完成'
}

const statusType: Record<string, any> = {
  running: 'success',
  stopped: 'info',
  error: 'danger',
  pending: 'warning',
  done: 'primary'
}

const onSearch = () => {
  pagination.value.page = 1
  fetchList()
}

const onReset = () => {
  filters.value.name = ''
  filters.value.status = ''
  pagination.value.page = 1
  fetchList()
}

const canRunBatch = computed(() => selection.value.some((r) => canRun(r)))
const canStopBatch = computed(() => selection.value.some((r) => canStop(r)))

const runOne = async (row: any) => {
  if (!canRun(row)) return
  store.selection = [row] as any
  await runSelected()
  ElMessage.success('已提交执行')
}

const stopOne = async (row: any) => {
  if (!canStop(row)) return
  await ElMessageBox.confirm('确认停止该任务吗？', '提示', { type: 'warning' })
  store.selection = [row] as any
  await stopSelected()
  ElMessage.success('已停止')
}

const onBatchRun = async () => {
  if (!canRunBatch.value) return
  await runSelected()
  ElMessage.success('已提交执行')
}

const onBatchStop = async () => {
  if (!canStopBatch.value) return
  await ElMessageBox.confirm('确认停止所选任务吗？', '提示', { type: 'warning' })
  await stopSelected()
  ElMessage.success('已停止')
}

const resetDialog = reactive({ visible: false, date: '' })
const openReset = (row?: any) => {
  if (row) store.selection = [row] as any
  resetDialog.visible = true
  resetDialog.date = ''
}

const confirmReset = async () => {
  if (!resetDialog.date) return ElMessage.warning('请选择开始日期')
  await resetSelected(resetDialog.date)
  resetDialog.visible = false
  ElMessage.success('已提交重置')
}

const detailDialog = reactive({ visible: false })
const openDetail = async (row: any) => {
  await fetchDetail(row.id)
  await fetchLogs(row.id)
  detailDialog.visible = true
}

onMounted(fetchList)
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
</style>
