import Mock from 'mockjs'
import { SUCCESS_CODE } from '@/constants'

const Random = Mock.Random
const timeout = 500

const statusPool = ['running', 'pending', 'error', 'done', 'stopped'] as const

function genTasks(count = 100) {
  const list = Array.from({ length: count }).map((_, idx) => {
    const status = Random.pick(statusPool)
    const duration = Random.integer(30, 6 * 3600) * 1000
    const finish = ['running', 'pending'].includes(status as any)
      ? undefined
      : Random.datetime('yyyy-MM-dd HH:mm:ss')
    return {
      id: Random.id(),
      name: `任务_${idx + 1}`,
      owner: Random.cname(),
      submitTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      finishTime: finish,
      durationMs: duration,
      status
    }
  })
  return list
}

const ALL = genTasks(120)

export default [
  {
    url: '/mock/task/list',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const { name, status, submitTimeStart, submitTimeEnd } = query || {}
      let filtered = ALL
      if (name) {
        filtered = filtered.filter((t) => String(t.name).includes(String(name)))
      }
      if (status) {
        filtered = filtered.filter((t) => String(t.status) === String(status))
      }
      if (submitTimeStart && submitTimeEnd) {
        const start = new Date(submitTimeStart as string).getTime()
        const end = new Date(submitTimeEnd as string).getTime()
        filtered = filtered.filter((t) => {
          const sub = new Date(t.submitTime).getTime()
          return sub >= start && sub <= end
        })
      }
      const page = Number(query?.page ?? 1)
      const pageSize = Number(query?.pageSize ?? 10)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return {
        code: SUCCESS_CODE,
        data: { total: filtered.length, list: filtered.slice(start, end) }
      }
    }
  },
  {
    url: '/mock/task/detail',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const id = query?.id
      const item = ALL.find((t) => String(t.id) === String(id))
      if (!item) {
        return { code: 404, message: 'not found' }
      }
      return {
        code: SUCCESS_CODE,
        data: {
          ...item,
          description: '这里是任务的描述信息……',
          logs: Array.from({ length: 15 }).map((_, i) => `日志 ${i + 1}：${Random.sentence()}`),
          dependencies: Array.from({ length: Random.integer(0, 3) }).map(() => ({
            id: Random.id(),
            name: `依赖任务_${Random.integer(1, 30)}`
          }))
        }
      }
    }
  },
  {
    url: '/mock/task/enable',
    method: 'post',
    timeout,
    response: () => ({ code: SUCCESS_CODE })
  },
  {
    url: '/mock/task/stop',
    method: 'post',
    timeout,
    response: () => ({ code: SUCCESS_CODE })
  }
]
