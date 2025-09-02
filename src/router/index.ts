import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout, getParentLayout } from '@/utils/routerHelper'
import { NO_RESET_WHITE_LIST } from '@/constants'

export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard/analysis',
    name: 'Root',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect',
    component: Layout,
    name: 'RedirectWrap',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: '登录',
      noTagsView: true
    }
  },
  {
    path: '/personal',
    component: Layout,
    redirect: '/personal/personal-center',
    name: 'Personal',
    meta: {
      title: '个人',
      hidden: true,
      canTo: true
    },
    children: [
      {
        path: 'personal-center',
        component: () => import('@/views/Personal/PersonalCenter/PersonalCenter.vue'),
        name: 'PersonalCenter',
        meta: {
          title: '个人中心',
          hidden: true,
          canTo: true
        }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFind',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  }
]

// 静态路由菜单 - 包含核心业务菜单
export const asyncRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: Layout,
    name: 'Dashboard',
    meta: {
      title: '首页',
      icon: 'vi-ant-design:dashboard-filled',
      alwaysShow: true
    },
    children: [
      {
        path: 'analysis',
        component: () => import('@/views/Dashboard/Analysis.vue'),
        name: 'Analysis',
        meta: {
          title: '分析页',
          noCache: true,
          affix: true
        }
      }
    ]
  },
  {
    path: '/task',
    component: Layout,
    name: 'Task',
    meta: { title: '任务管理', icon: 'vi-ep:list', alwaysShow: true },
    children: [
      {
        path: 'manual',
        component: () => import('@/views/Task/ManualTask.vue'),
        name: 'TaskManual',
        meta: { title: '手动任务', icon: 'vi-ep:document', permission: ['view'] }
      },
      {
        path: 'auto',
        component: () => import('@/views/Task/AutoTask.vue'),
        name: 'TaskAuto',
        meta: { title: '自动任务', icon: 'vi-ep:timer', permission: ['view'] }
      },
      {
        path: 'detail',
        component: () => import('@/views/Task/TaskDetail.vue'),
        name: 'TaskDetail',
        meta: { title: '任务详情', hidden: true, canTo: true, activeMenu: '/task/manual' }
      }
    ]
  },
  {
    path: '/lineage',
    component: Layout,
    name: 'Lineage',
    meta: { title: '血缘分析', icon: 'vi-ep:share', alwaysShow: true },
    children: [
      {
        path: 'impact',
        component: () => import('@/views/Lineage/Impact.vue'),
        name: 'LineageImpact',
        meta: { title: '影响分析' }
      },
      {
        path: 'dag',
        component: () => import('@/views/Lineage/Dag.vue'),
        name: 'LineageDag',
        meta: { title: '任务DAG图' }
      }
    ]
  },
  {
    path: '/tools',
    component: Layout,
    name: 'Tools',
    meta: { title: '工具箱', icon: 'vi-ep:tools', alwaysShow: true },
    children: [
      {
        path: 'encrypt',
        component: () => import('@/views/Placeholder.vue'),
        name: 'ToolsEncrypt',
        meta: { title: '数据加密' }
      },
      {
        path: 'template',
        component: () => import('@/views/Placeholder.vue'),
        name: 'ToolsTemplate',
        meta: { title: '任务模板下载' }
      },
      {
        path: 'sql',
        component: () => import('@/views/Placeholder.vue'),
        name: 'ToolsSql',
        meta: { title: 'SQL转换工具' }
      }
    ]
  },
  {
    path: '/governance',
    component: Layout,
    name: 'Governance',
    meta: { title: '数据治理', icon: 'vi-ep:monitor', alwaysShow: true },
    children: [
      {
        path: 'compare',
        component: () => import('@/views/Placeholder.vue'),
        name: 'GovernanceCompare',
        meta: { title: '表结构对比' }
      },
      {
        path: 'consistency',
        component: () => import('@/views/Placeholder.vue'),
        name: 'GovernanceConsistency',
        meta: { title: '一致性校验' }
      }
    ]
  },
  {
    path: '/settings',
    component: Layout,
    name: 'Settings',
    meta: { title: '设置', icon: 'vi-ep:setting', alwaysShow: true },
    children: [
      {
        path: 'config',
        component: () => import('@/views/Placeholder.vue'),
        name: 'SettingsConfig',
        meta: { title: '配置管理' }
      },
      {
        path: 'datasource',
        component: () => import('@/views/Placeholder.vue'),
        name: 'SettingsDatasource',
        meta: { title: '数据源管理' }
      },
      {
        path: 'authorization',
        component: getParentLayout(),
        redirect: '/settings/authorization/user',
        name: 'Authorization',
        meta: {
          title: '权限管理',
          alwaysShow: true
        },
        children: [
          {
            path: 'department',
            component: () => import('@/views/Authorization/Department/Department.vue'),
            name: 'Department',
            meta: {
              title: '所属部门'
            }
          },
          {
            path: 'user',
            component: () => import('@/views/Authorization/User/User.vue'),
            name: 'User',
            meta: {
              title: '用户管理'
            }
          },
          {
            path: 'role',
            component: () => import('@/views/Authorization/Role/Role.vue'),
            name: 'Role',
            meta: {
              title: '角色管理'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/monitor',
    component: Layout,
    name: 'Monitor',
    meta: { title: '运维监控', icon: 'vi-ep:view', alwaysShow: true },
    children: [
      {
        path: 'alerts',
        component: () => import('@/views/Placeholder.vue'),
        name: 'MonitorAlerts',
        meta: { title: '告警' }
      },
      {
        path: 'statistics',
        component: () => import('@/views/Placeholder.vue'),
        name: 'MonitorStatistics',
        meta: { title: '任务统计' }
      },
      {
        path: 'resources',
        component: () => import('@/views/Placeholder.vue'),
        name: 'MonitorResources',
        meta: { title: '资源监控' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: constantRouterMap.concat(asyncRouterMap) as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !NO_RESET_WHITE_LIST.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
