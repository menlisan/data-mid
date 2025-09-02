<template>
  <div class="p-1">
    <ElCard shadow="hover" class="mb-1">
      <template #header>
        <!-- 筛选 -->
        <div class="grid gap-12 md:grid-cols-4 sm:grid-cols-2 grid-cols-1 mb-8 mt-6">
          <ElInput v-model="filters.name" placeholder="任务名称（模糊）" clearable />
          <ElSelect v-model="filters.status" placeholder="任务状态" clearable>
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
        <div class="flex items-center justify-between mb-4">
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
                  @click="onBatchRun"
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
                  @click="onBatchStop"
                  >批量停止</ElButton
                >
              </div>
            </ElTooltip>
          </div>
        </div>
      </template>
      <div
        class="inline-flex rounded-md border border-gray-300 bg-white overflow-hidden select-none"
      >
        <ElButton
          v-for="(label, status) in statusText"
          :key="status"
          size="small"
          @click="onStatusFilter(status)"
          :class="[
            '!m-0 min-w-[48px] text-xs px-3 py-1 cursor-pointer transition-colors duration-150 first:rounded-l-md last:rounded-r-md border-r border-gray-300 last:border-r-0',
            filters.status === status
              ? 'bg-blue-400 text-white hover:bg-blue-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
          ]"
        >
          {{ label }}
        </ElButton>
      </div>

      <!-- 表格 -->
      <ElTable
        :data="list"
        v-loading="loading"
        size="large"
        @selection-change="setSelection"
        row-key="id"
      >
        <ElTableColumn type="selection" width="42" />
        <ElTableColumn prop="name" label="任务名称" min-width="160" />
        <ElTableColumn prop="executeDate" label="执行日期" width="140" />
        <ElTableColumn label="任务状态" width="120">
          <template #default="scope">
            <template v-if="scope && scope.row">
              <ElTag :type="statusType[scope.row.status]">{{ statusText[scope.row.status] }}</ElTag>
            </template>
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
        <ElTableColumn label="操作" width="320" fixed="right">
          <template #default="scope">
            <template v-if="scope && scope.row">
              <ElTooltip
                :content="canRun(scope.row) ? '执行任务' : '运行中的任务不可再次执行'"
                placement="top"
              >
                <div class="inline-block">
                  <ElButton
                    link
                    type="success"
                    :disabled="!canRun(scope.row)"
                    @click="runOne(scope.row)"
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
                    @click="stopOne(scope.row)"
                    >停止</ElButton
                  >
                </div>
              </ElTooltip>
              <ElButton link type="primary" @click="openDetail(scope.row)">详情</ElButton>
              <ElButton link type="info" @click="openReset(scope.row)">重置</ElButton>
            </template>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-end mt-12">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="prev, pager, next, jumper, sizes, total"
          @current-change="fetchList"
          @size-change="
            () => {
              pagination.page = 1
              fetchList()
            }
          "
        />
      </div>
    </ElCard>

    <!-- 重置对话框 -->
    <ElDialog v-model="resetDialog.visible" title="重置任务" width="420px">
      <ElDatePicker
        v-model="resetDialog.date"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="选择开始日期"
      />
      <template #footer>
        <ElButton @click="resetDialog.visible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmReset">确定</ElButton>
      </template>
    </ElDialog>

    <!-- 详情对话框 -->
    <ElDialog v-model="detailDialog.visible" title="任务详情" width="70%">
      <ElDescriptions :column="3" border v-if="detail">
        <ElDescriptionsItem label="任务名称">{{ detail.name }}</ElDescriptionsItem>
        <ElDescriptionsItem label="负责人">{{ detail.owner }}</ElDescriptionsItem>
        <ElDescriptionsItem label="状态">{{ statusText[detail.status] }}</ElDescriptionsItem>
        <ElDescriptionsItem label="执行日期">{{ detail.executeDate }}</ElDescriptionsItem>
        <ElDescriptionsItem label="提交时间">{{ detail.submitTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="执行时间">{{ detail.executeTime || '--' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="耗时">{{
          detail.durationMs ? Math.round(detail.durationMs / 1000) + 's' : '--'
        }}</ElDescriptionsItem>
        <ElDescriptionsItem :span="3" label="描述">{{
          detail.description || '—'
        }}</ElDescriptionsItem>
      </ElDescriptions>
      <ElDivider />
      <div>
        <div class="font-600 mb-8">任务日志</div>
        <ElScrollbar height="260px">
          <div class="text-xs leading-6">
            <div v-for="(log, i) in logs" :key="i">{{ i + 1 }}. {{ log }}</div>
          </div>
        </ElScrollbar>
      </div>
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
  ElDivider,
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

// 处理点击状态筛选按钮的逻辑
const onStatusFilter = (status: string) => {
  // 运行中/等待/异常(映射为error)/停止/完成
  const mapped = (status === 'failed' ? 'error' : status) as any
  filters.value.status = mapped // 更新筛选条件
  pagination.value.page = 1 // 重置分页到第一页
  fetchList() // 根据更新的筛选条件刷新任务列表
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
.filter-bar {
  display: flex;
  justify-content: center;
}

.filter-group {
  display: flex;
  gap: 0; /* 保证按钮之间没有间隙 */
  border-radius: 20px; /* 父容器的圆角 */
  overflow: hidden; /* 避免按钮的圆角外溢 */
}

.filter-button {
  padding: 6px 12px;
  font-size: 14px;
  height: auto;
  margin: 0; /* 去除按钮之间的默认间距 */
}

.filter-button.selected {
  background-color: #409eff !important; /* 选中时的背景色 */
  color: #ffffff !important; /* 选中时的文字颜色 */
  border-color: #409eff !important; /* 选中时的边框颜色 */
}
</style>
