import request from '@/axios'

export type TaskStatus = 'running' | 'pending' | 'error' | 'stopped' | 'done'

export interface DagNode {
  id: string
  status: TaskStatus
}

export interface DagEdge {
  source: string
  target: string
}

export interface DagData {
  id: string
  status: TaskStatus
  nodes: DagNode[]
  edges: DagEdge[]
}

export const getDag = (taskId: string) =>
  request.get<DagData>({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/get-dag' : '/get-dag',
    params: { taskId }
  })

export const runTask = (taskId: string) =>
  request.post({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/run-task' : '/run-task',
    data: { taskId }
  })

export const cancelTask = (taskId: string) =>
  request.post({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/cancel-task' : '/cancel-task',
    data: { taskId }
  })

export const resetTask = (taskId: string, startDate: string) =>
  request.post({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/reset-task' : '/reset-task',
    data: { taskId, startDate }
  })

export interface TaskDetail {
  taskId: string
  status: TaskStatus
  owner: string
  createTime: string
  updateTime: string
  duration?: string
  logs?: string[]
}

export const getTaskDetailInfo = (taskId: string) =>
  request.get<TaskDetail>({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/task-detail' : '/task-detail',
    params: { taskId }
  })
