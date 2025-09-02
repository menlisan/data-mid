import request from '@/axios'

export type ManualTaskStatus = 'running' | 'stopped' | 'error' | 'pending' | 'done'

export interface ManualTaskItem {
  id: string | number
  name: string
  owner: string
  executeDate: string
  status: ManualTaskStatus
  submitTime: string
  executeTime?: string
  durationMs?: number
}

export interface ManualListQuery {
  name?: string
  status?: ManualTaskStatus | ''
  page?: number
  pageSize?: number
}

export interface ManualListResp {
  code: number
  data: { total: number; list: ManualTaskItem[] }
}

export interface ManualDetailResp {
  code: number
  data: ManualTaskItem & { logs?: string[]; description?: string }
}

export const getManualTaskList = (params: ManualListQuery) =>
  request.get<ManualListResp>({ url: '/waiting-task-list', params })

export const runManualTasks = (ids: Array<string | number>) =>
  request.post({ url: '/run-manual-task2', data: { ids } })

export const stopManualTasks = (ids: Array<string | number>) =>
  request.post({ url: '/cancel-manual-task', data: { ids } })

export const resetManualTasks = (ids: Array<string | number>, startDate: string) =>
  request.post({ url: '/reset-task', data: { ids, startDate } })

export const getTaskLogs = (id: string | number) =>
  request.get<{ code: number; data: { logs: string[] } }>({ url: '/task-log', params: { id } })

export const getTaskDetail = (id: string | number) =>
  request.get<ManualDetailResp>({ url: '/task-log-detail', params: { id } })
