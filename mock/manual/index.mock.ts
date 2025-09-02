import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const Random = Mock.Random
const timeout = 600

const statusPool = ['running', 'stopped', 'error', 'pending', 'done']

function genList(count = 100) {
  return Array.from({ length: count }).map(() => ({
    id: Random.id(),
    name: `手动任务_${Random.integer(1, 500)}`,
    owner: Random.cname(),
    executeDate: Random.date('yyyy-MM-dd'),
    status: Random.pick(statusPool),
    submitTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
    executeTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
    durationMs: Random.integer(30, 6 * 3600) * 1000
  }))
}

const ALL = genList(180)

export default [
  {
    url: '/waiting-task-list',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const page = Number(query?.page ?? 1)
      const pageSize = Number(query?.pageSize ?? 20)
      const name = String(query?.name ?? '')
      const status = String(query?.status ?? '')
      let filtered = ALL
      if (name) filtered = filtered.filter((i) => i.name.includes(name))
      if (status) filtered = filtered.filter((i) => i.status === status)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return { code: SUCCESS_CODE, data: { total: filtered.length, list: filtered.slice(start, end) } }
    }
  },
  {
    url: '/run-manual-task2',
    method: 'post',
    timeout,
    response: () => ({ code: SUCCESS_CODE })
  },
  {
    url: '/cancel-manual-task',
    method: 'post',
    timeout,
    response: () => ({ code: SUCCESS_CODE })
  },
  {
    url: '/reset-task',
    method: 'post',
    timeout,
    response: () => ({ code: SUCCESS_CODE })
  },
  {
    url: '/task-log',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const id = query?.id
      return {
        code: SUCCESS_CODE,
        data: { logs: Array.from({ length: 20 }).map((_, i) => `日志 ${i + 1}: ${Random.sentence()}`) }
      }
    }
  },
  {
    url: '/task-log-detail',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const item = Random.pick(ALL)
      return { code: SUCCESS_CODE, data: item }
    }
  }
]
