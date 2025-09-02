<script lang="ts" setup>
defineOptions({ name: 'LineageImpact' })
import { ref, reactive, computed } from 'vue'
import {
  ElMessage,
  ElButton,
  ElTabs,
  ElTabPane,
  ElInput,
  ElUpload,
  type UploadProps
} from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Table, type TableColumn, type Pagination } from '@/components/Table'
import {
  getSqlTextLineage,
  getSqlFileLineage,
  getSqlTableLineage,
  getSqlFieldLineage,
  type LineageItem
} from '@/api/lineage'

type TabKey = 'sql' | 'file' | 'table' | 'field'

const activeTab = ref<TabKey>('sql')

const sqlText = ref('')
const tableName = ref('')
const fieldName = ref('')
const fileRaw = ref<File | null>(null)

const loading = ref(false)

const dataSource = ref<LineageItem[]>([])

const page = reactive({ currentPage: 1, pageSize: 10 })
const total = ref(0)

const filteredData = computed(() => {
  return dataSource.value
})

const pageData = computed(() => {
  const start = (page.currentPage - 1) * page.pageSize
  const end = start + page.pageSize
  return filteredData.value.slice(start, end)
})

const pagination = computed<Pagination>(() => ({
  total: total.value,
  pageSizes: [10, 20, 30, 50, 100],
  layout: 'sizes, prev, pager, next, jumper, ->, total',
  currentPage: page.currentPage,
  pageSize: page.pageSize
}))

const columns = ref<TableColumn[]>([
  { field: 'index', type: 'index', label: '#', width: 60 },
  { field: 'name', label: '名称', minWidth: 160 },
  {
    field: 'type',
    label: '类型',
    minWidth: 100,
    filters: [
      { text: 'Table', value: 'Table' },
      { text: 'Field', value: 'Field' },
      { text: 'View', value: 'View' }
    ],
    filterMethod: (value: string, row: LineageItem) => row.type === value
  },
  { field: 'source_table', label: '源表', minWidth: 200, showOverflowTooltip: true },
  { field: 'source_db_user', label: 'schema名', minWidth: 140 },
  { field: 'source_db_ip', label: '数据库IP', minWidth: 140 },
  { field: 'features', label: '特征', minWidth: 160, showOverflowTooltip: true },
  { field: 'dependency', label: '依赖关系', minWidth: 220, showOverflowTooltip: true }
])

const onUpload: UploadProps['onChange'] = (file) => {
  fileRaw.value = file.raw || null
}

const validate = () => {
  if (activeTab.value === 'sql' && !sqlText.value.trim()) {
    ElMessage.warning('请输入 SQL 查询语句')
    return false
  }
  if (activeTab.value === 'file' && !fileRaw.value) {
    ElMessage.warning('请上传 .sql 文件')
    return false
  }
  if (activeTab.value === 'table' && !tableName.value.trim()) {
    ElMessage.warning('请输入表名')
    return false
  }
  if (activeTab.value === 'field' && !fieldName.value.trim()) {
    ElMessage.warning('请输入字段名')
    return false
  }
  return true
}

const fetchData = async () => {
  if (!validate()) return
  loading.value = true
  try {
    let res: IResponse<LineageItem[]> | undefined
    if (activeTab.value === 'sql') {
      res = await getSqlTextLineage(sqlText.value)
    } else if (activeTab.value === 'file' && fileRaw.value) {
      res = await getSqlFileLineage(fileRaw.value)
    } else if (activeTab.value === 'table') {
      res = await getSqlTableLineage(tableName.value)
    } else if (activeTab.value === 'field') {
      res = await getSqlFieldLineage(fieldName.value)
    }
    if (res) {
      dataSource.value = res.data || []
      total.value = dataSource.value.length
      page.currentPage = 1
    }
  } catch (e: any) {
    // 错误提示已在拦截器中处理
  } finally {
    loading.value = false
  }
}

const onTabChange = () => {
  // 清理状态，避免串场
  sqlText.value = ''
  tableName.value = ''
  fieldName.value = ''
  fileRaw.value = null
  dataSource.value = []
  total.value = 0
  page.currentPage = 1
}
</script>

<template>
  <ContentWrap title="影响分析">
    <ElTabs v-model="activeTab" type="border-card" @tab-change="onTabChange">
      <ElTabPane label="SQL 文本" name="sql">
        <ElInput
          v-model="sqlText"
          type="textarea"
          :rows="8"
          placeholder="请输入 SQL 查询语句"
          clearable
        />
      </ElTabPane>
      <ElTabPane label="SQL 文件" name="file">
        <ElUpload drag :auto-upload="false" accept=".sql" :on-change="onUpload" :limit="1">
          <i class="vi-ep:upload-filled text-36px"></i>
          <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持 .sql 文件</div>
          </template>
        </ElUpload>
      </ElTabPane>
      <ElTabPane label="SQL 表" name="table">
        <ElInput v-model="tableName" placeholder="请输入表名，如 schema.table" clearable />
      </ElTabPane>
      <ElTabPane label="SQL 字段" name="field">
        <ElInput v-model="fieldName" placeholder="请输入字段名，如 schema.table.column" clearable />
      </ElTabPane>
    </ElTabs>

    <div class="mt-16px flex items-center gap-8px">
      <ElButton type="primary" :loading="loading" @click="fetchData">查看血缘分析</ElButton>
      <span class="text-12px text-gray-500">支持文本、文件、表、字段四种方式</span>
    </div>
  </ContentWrap>

  <ContentWrap class="mt-12px" title="分析结果">
    <Table
      :data="pageData"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="name"
      border
      show-action
      @update:pageSize="
        (v: number) => {
          page.pageSize = v
        }
      "
      @update:currentPage="
        (v: number) => {
          page.currentPage = v
        }
      "
    />
  </ContentWrap>
</template>

<style scoped>
.el-upload__text em {
  color: var(--el-color-primary);
}
</style>
