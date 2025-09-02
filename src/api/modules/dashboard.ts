import request from '@/axios'

export interface SummaryMetricsResponse {
  code: number
  data: {
    running: number
    pending: number
    error: number
    doneToday: number
  }
}

export interface RecentTaskItem {
  id: string | number
  name: string
  owner: string
  submitTime: string
  finishTime?: string
  durationMs?: number
  status: 'running' | 'pending' | 'error' | 'done' | 'stopped'
}

export interface RecentTasksResponse {
  code: number
  data: {
    total: number
    list: RecentTaskItem[]
  }
}

export interface TrendPoint {
  date: string
  count: number
}
export interface TrendResponse {
  code: number
  data: TrendPoint[]
}

export interface StatusDistributionItem {
  name: string
  value: number
}
export interface StatusDistributionResponse {
  code: number
  data: StatusDistributionItem[]
}

export const getSummaryMetrics = () =>
  request.get<SummaryMetricsResponse>({ url: '/mock/dashboard/summary-metrics' })

export const getRecentTasks = (params?: { page?: number; pageSize?: number }) =>
  request.get<RecentTasksResponse>({ url: '/mock/dashboard/recent-tasks', params })

export const getTaskTrend = (params?: { days?: number }) =>
  request.get<TrendResponse>({ url: '/mock/dashboard/trend', params })

export const getStatusDistribution = () =>
  request.get<StatusDistributionResponse>({ url: '/mock/dashboard/status-distribution' })
