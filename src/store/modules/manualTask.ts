import { defineStore } from 'pinia'
import type { ManualTaskItem, ManualTaskStatus } from '@/api/modules/manualTask'
import {
  getManualTaskList,
  runManualTasks,
  stopManualTasks,
  resetManualTasks,
  getTaskDetail,
  getTaskLogs
} from '@/api/modules/manualTask'

export const useManualTaskStore = defineStore('manualTask', {
  state: () => ({
    filters: { name: '' as string, status: '' as ManualTaskStatus | '' },
    pagination: { page: 1, pageSize: 20, total: 0 },
    list: [] as ManualTaskItem[],
    loading: false,
    selection: [] as ManualTaskItem[],
    detail: null as any,
    logs: [] as string[]
  }),
  getters: {
    canRun: () => (row: ManualTaskItem) => row.status !== 'running',
    canStop: () => (row: ManualTaskItem) => row.status === 'running'
  },
  actions: {
    async fetchList() {
      this.loading = true
      try {
        const { data } = await getManualTaskList({
          name: this.filters.name,
          status: this.filters.status,
          page: this.pagination.page,
          pageSize: this.pagination.pageSize
        })
        this.list = data.list
        this.pagination.total = data.total
      } finally {
        this.loading = false
      }
    },
    setSelection(rows: ManualTaskItem[]) {
      this.selection = rows
    },
    setPage(page: number) {
      this.pagination.page = page
    },
    setPageSize(size: number) {
      this.pagination.pageSize = size
      this.pagination.page = 1
    },
    clearFilters() {
      this.filters.name = ''
      this.filters.status = ''
      this.pagination.page = 1
    },
    async runSelected() {
      if (this.selection.length === 0) return
      await runManualTasks(this.selection.map((i) => i.id))
      await this.fetchList()
    },
    async stopSelected() {
      if (this.selection.length === 0) return
      await stopManualTasks(this.selection.map((i) => i.id))
      await this.fetchList()
    },
    async resetSelected(startDate: string) {
      if (this.selection.length === 0) return
      await resetManualTasks(
        this.selection.map((i) => i.id),
        startDate
      )
      await this.fetchList()
    },
    async fetchDetail(id: string | number) {
      const { data } = await getTaskDetail(id)
      this.detail = data
    },
    async fetchLogs(id: string | number) {
      const { data } = await getTaskLogs(id)
      this.logs = data.logs
    }
  }
})

export const useManualTaskStoreWithOut = () => useManualTaskStore()
