import request from '@/axios'

export type TaskStatus = 'running' | 'pending' | 'error' | 'done' | 'stopped'

export interface TaskListQuery {
  name?: string
  status?: TaskStatus
  submitTimeStart?: string
  submitTimeEnd?: string
  page?: number
  pageSize?: number
}

export interface TaskItem {
  id: string | number
  name: string
  owner: string
  submitTime: string
  finishTime?: string
  durationMs?: number
  status: TaskStatus
}

export interface TaskListResponse {
  code: number
  data: { total: number; list: TaskItem[] }
}

export interface TaskDetail extends TaskItem {
  logs: string[]
  dependencies: Array<{ id: string | number; name: string }>
  description?: string
}

export interface TaskDetailResponse { code: number; data: TaskDetail }

export const getTaskListApi = (params: TaskListQuery) =>
  request.get<TaskListResponse>({ url: '/mock/task/list', params })

export const enableTasksApi = (ids: Array<string | number>) =>
  request.post({ url: '/mock/task/enable', data: { ids } })

export const stopTasksApi = (ids: Array<string | number>) =>
  request.post({ url: '/mock/task/stop', data: { ids } })

export const getTaskDetailApi = (id: string | number) =>
  request.get<TaskDetailResponse>({ url: '/mock/task/detail', params: { id } })
