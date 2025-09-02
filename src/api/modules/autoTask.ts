import request from '@/axios'

export type AutoTaskStatus = 'running' | 'pending' | 'error' | 'stopped' | 'done'

export interface AutoTaskItem {
  id: string | number
  name: string
  owner: string
  submitTime: string
  executeTime?: string
  durationMs?: number
  status: AutoTaskStatus
}

export interface AutoTaskListQuery {
  name?: string
  status?: AutoTaskStatus | ''
  page?: number
  pageSize?: number
}

export interface AutoTaskListResp {
  code: number
  data: { total: number; list: AutoTaskItem[] }
}

export const getAutoTaskList = (params: AutoTaskListQuery) =>
  request.get<AutoTaskListResp>({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/auto-task/list' : '/auto-task/list',
    params
  })

export const executeAutoTask = (taskId: string | number, startTime: string) =>
  request.post({
    url:
      import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/auto-task/execute' : '/auto-task/execute',
    data: { taskId, startTime }
  })

export const stopAutoTask = (taskId: string | number) =>
  request.post({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/auto-task/stop' : '/auto-task/stop',
    data: { taskId }
  })

export const resetAutoTask = (taskId: string | number, startDate: string) =>
  request.post({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/reset-task' : '/reset-task',
    data: { taskId, startDate }
  })

export const getAutoTaskLogDetail = (taskId: string | number) =>
  request.get<{ code: number; data: { logs: string[]; task: Partial<AutoTaskItem> } }>({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/task-log-detail' : '/task-log-detail',
    params: { taskId }
  })

export const fillLogs = (taskId: string | number) =>
  request.post({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/fill-logs' : '/fill-logs',
    data: { taskId }
  })
