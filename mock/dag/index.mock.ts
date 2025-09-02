import { SUCCESS_CODE } from '@/constants'

const dagData = {
  id: 'task_main',
  status: 'running',
  nodes: [
    { id: 'task_main_MM', status: 'running' },
    { id: 'GP_task_X_AAA', status: 'done' },
    { id: 'GP_task_BBB', status: 'running' },
    { id: 'GP_task_CCC', status: 'pending' },
    { id: 'GP_task_DDDD', status: 'error' },
    { id: 'GP_task_EEEE', status: 'done' },
    { id: 'GP_task_FFFF', status: 'stopped' },
    { id: 'GP_task_GGGG', status: 'running' },
    { id: 'GP_task_HHHH', status: 'pending' },
    { id: 'GP_task_IIII', status: 'done' }
  ],
  edges: [
    { source: 'GP_task_X_AAA', target: 'task_main_MM' },
    { source: 'GP_task_BBB', target: 'GP_task_X_AAA' },
    { source: 'task_main_MM', target: 'GP_task_CCC' },
    { source: 'task_main_MM', target: 'GP_task_DDDD' },
    { source: 'GP_task_EEEE', target: 'GP_task_X_AAA' },
    { source: 'GP_task_EEEE', target: 'GP_task_FFFF' },
    { source: 'GP_task_GGGG', target: 'GP_task_BBB' },
    { source: 'GP_task_HHHH', target: 'GP_task_BBB' },
    { source: 'GP_task_DDDD', target: 'GP_task_IIII' }
  ]
}

export default [
  {
    url: '/mock/get-dag',
    method: 'get',
    response: ({ query }: any) => {
      const taskId = query?.taskId || 'task_main'
      return { code: SUCCESS_CODE, data: { ...dagData, id: taskId } }
    }
  },
  {
    url: '/mock/run-task',
    method: 'post',
    response: () => ({ code: SUCCESS_CODE, data: true })
  },
  {
    url: '/mock/cancel-task',
    method: 'post',
    response: () => ({ code: SUCCESS_CODE, data: true })
  },
  {
    url: '/mock/reset-task',
    method: 'post',
    response: () => ({ code: SUCCESS_CODE, data: true })
  },
  {
    url: '/mock/task-detail',
    method: 'get',
    response: ({ query }: any) => {
      const taskId = query?.taskId || 'task_main'
      return {
        code: SUCCESS_CODE,
        data: {
          taskId,
          status: 'running',
          owner: 'A99',
          createTime: '2025-08-09T10:00:00Z',
          updateTime: '2025-08-09T10:10:00Z',
          duration: '5s',
          logs: ['20250810 INFO xxxxx;task reset;']
        }
      }
    }
  }
]


