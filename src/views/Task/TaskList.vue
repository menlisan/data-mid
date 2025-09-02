<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getTaskListApi,
  enableTasksApi,
  stopTasksApi,
  type TaskItem,
  type TaskStatus
} from '@/api/modules/task'

const route = useRoute()
const router = useRouter()

const queryForm = reactive<{ name?: string; status?: TaskStatus | ''; range?: string[] | null }>({
  name: '',
  status: (route.query.status as TaskStatus) || '',
  range: null
})

const tableData = ref<TaskItem[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const selection = ref<TaskItem[]>([])

const fetchList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (queryForm.name) params.name = queryForm.name
    if (queryForm.status) params.status = queryForm.status
    if (queryForm.range?.length === 2) {
      params.submitTimeStart = queryForm.range[0]
      params.submitTimeEnd = queryForm.range[1]
    }
    const { data } = await getTaskListApi(params)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)

watch(
  () => route.query.status,
  (v) => {
    queryForm.status = (v as TaskStatus) || ''
    page.value = 1
    fetchList()
  }
)

const onSearch = () => {
  page.value = 1
  fetchList()
}

const onReset = () => {
  queryForm.name = ''
  queryForm.status = ''
  queryForm.range = null
  page.value = 1
  fetchList()
}

const onSelectionChange = (rows: TaskItem[]) => {
  selection.value = rows
}

const batchEnable = async () => {
  if (selection.value.length === 0) return ElMessage.warning('请选择任务')
  await enableTasksApi(selection.value.map((i) => i.id))
  ElMessage.success('批量启用成功')
}

const batchStop = async () => {
  if (selection.value.length === 0) return ElMessage.warning('请选择任务')
  await ElMessageBox.confirm('确认停止选中任务吗？', '提示', { type: 'warning' })
  await stopTasksApi(selection.value.map((i) => i.id))
  ElMessage.success('批量停止成功')
}

const goDetail = (row: TaskItem) => {
  router.push({ path: '/task/detail', query: { id: String(row.id) } })
}
</script>

<template>
  <div class="p-16">
    <el-card shadow="hover" class="mb-16">
      <template #header>
        <div class="font-600">任务筛选</div>
      </template>
      <div class="grid gap-12 md:grid-cols-4 sm:grid-cols-2 grid-cols-1">
        <el-input v-model="queryForm.name" placeholder="任务名（模糊）" clearable />
        <el-select v-model="queryForm.status" placeholder="状态" clearable>
          <el-option label="运行中" value="running" />
          <el-option label="等待中" value="pending" />
          <el-option label="异常" value="error" />
          <el-option label="已完成" value="done" />
          <el-option label="已停止" value="stopped" />
        </el-select>
        <el-date-picker
          v-model="queryForm.range"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          clearable
        />
        <div>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-600">任务列表</span>
          <div>
            <el-button type="success" @click="batchEnable">批量启用</el-button>
            <el-button type="warning" @click="batchStop">批量停止</el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="tableData"
        v-loading="loading"
        size="small"
        @selection-change="onSelectionChange"
        class="w-full"
      >
        <el-table-column type="selection" width="42" />
        <el-table-column prop="name" label="任务名称" min-width="180" />
        <el-table-column prop="owner" label="负责人" width="120" />
        <el-table-column prop="submitTime" label="提交时间" min-width="160" />
        <el-table-column prop="finishTime" label="完成时间" min-width="160" />
        <el-table-column label="耗时" width="120">
          <template #default="{ row }">
            <span v-if="row.durationMs">{{ Math.round(row.durationMs / 1000) }}s</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" @click="enableTasksApi([row.id])">启用</el-button>
            <el-button link type="warning" @click="stopTasksApi([row.id])">停止</el-button>
            <el-button link type="primary" @click="goDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-12">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          background
          layout="prev, pager, next, jumper, sizes, total"
          @current-change="fetchList"
          @size-change="
            () => {
              page = 1
              fetchList()
            }
          "
        />
      </div>
    </el-card>
  </div>
</template>
