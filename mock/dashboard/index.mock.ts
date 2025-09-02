import Mock from 'mockjs'
const Random = Mock.Random
const timeout = 600

const statusPool = ['running', 'pending', 'error', 'done', 'stopped']

function genRecentTasks(count = 12) {
  const list = Array.from({ length: count }).map((_, idx) => {
    const status = Random.pick(statusPool)
    const submit = Random.datetime('yyyy-MM-dd HH:mm:ss')
    const duration = Random.integer(30, 60 * 60) * 1000
    const finish = ['running', 'pending'].includes(status) ? undefined : Random.datetime('yyyy-MM-dd HH:mm:ss')
    return {
      id: Random.id(),
      name: `任务_${idx + 1}`,
      owner: Random.cname(),
      submitTime: submit,
      finishTime: finish,
      durationMs: duration,
      status
    }
  })
  return list
}

function genTrend(days = 14) {
  const base = new Date()
  const list = [] as { date: string; count: number }[]
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 24 * 3600 * 1000)
    const month = `${d.getMonth() + 1}`.padStart(2, '0')
    const day = `${d.getDate()}`.padStart(2, '0')
    list.push({ date: `${d.getFullYear()}-${month}-${day}`, count: Random.integer(10, 200) })
  }
  return list
}

export default [
  {
    url: '/mock/dashboard/summary-metrics',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: 200,
        data: {
          running: Random.integer(5, 50),
          pending: Random.integer(5, 50),
          error: Random.integer(0, 20),
          doneToday: Random.integer(20, 200)
        }
      }
    }
  },
  {
    url: '/mock/dashboard/recent-tasks',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const page = Number(query?.page ?? 1)
      const pageSize = Number(query?.pageSize ?? 6)
      const all = genRecentTasks(30)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return {
        code: 200,
        data: {
          total: all.length,
          list: all.slice(start, end)
        }
      }
    }
  },
  {
    url: '/mock/dashboard/trend',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const days = Number(query?.days ?? 14)
      return {
        code: 200,
        data: genTrend(days)
      }
    }
  },
  {
    url: '/mock/dashboard/status-distribution',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: 200,
        data: [
          { name: '运行中', value: Random.integer(10, 80) },
          { name: '等待中', value: Random.integer(5, 60) },
          { name: '异常', value: Random.integer(0, 30) },
          { name: '已完成', value: Random.integer(20, 120) }
        ]
      }
    }
  }
]
