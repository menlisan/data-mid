import { SUCCESS_CODE } from '@/constants'

const list = Array.from({ length: 28 }).map((_, i) => {
  const status = ['running', 'pending', 'error', 'stopped', 'done'][i % 5]
  return {
    id: i + 1,
    name: `auto_task_${i + 1}`,
    owner: `user_${(i % 4) + 1}`,
    submitTime: `2025-08-0${(i % 9) + 1} 10:0${i % 6}:00`,
    executeTime: `2025-08-0${(i % 9) + 1} 10:1${i % 6}:00`,
    durationMs: (i + 1) * 1234,
    status
  }
})

export default [
  {
    url: '/mock/auto-task/list',
    method: 'get',
    response: ({ query }: any) => {
      let data = list
      if (query?.name) data = data.filter((i) => String(i.name).includes(query.name))
      if (query?.status) data = data.filter((i) => i.status === query.status)
      const page = Number(query?.page || 1)
      const pageSize = Number(query?.pageSize || 10)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return { code: SUCCESS_CODE, data: { total: data.length, list: data.slice(start, end) } }
    }
  },
  { url: '/mock/auto-task/execute', method: 'post', response: () => ({ code: SUCCESS_CODE, data: true }) },
  { url: '/mock/auto-task/stop', method: 'post', response: () => ({ code: SUCCESS_CODE, data: true }) },
  { url: '/mock/reset-task', method: 'post', response: () => ({ code: SUCCESS_CODE, data: true }) },
  {
    url: '/mock/task-log-detail',
    method: 'get',
    response: ({ query }: any) => {
      const taskId = query?.taskId || '1'
      return {
        code: SUCCESS_CODE,
        data: {
          task: list.find((i) => String(i.id) === String(taskId)) || list[0],
          logs: [
            '2025-08-10 10:00:00 INFO start task',
            '2025-08-10 10:01:00 INFO processing...',
            '2025-08-10 10:02:00 WARN slow node',
            '2025-08-10 10:03:00 ERROR retry step'
          ]
        }
      }
    }
  },
  { url: '/mock/fill-logs', method: 'post', response: () => ({ code: SUCCESS_CODE, data: true }) }
]


