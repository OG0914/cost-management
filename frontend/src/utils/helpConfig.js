// 帮助文档目录配置
export const helpMenuConfig = [
  {
    title: '快速入门',
    path: '/help/quick-start',
    file: 'quick-start.md',
    icon: 'ri-rocket-line',
    roles: ['admin', 'reviewer', 'salesperson', 'purchaser', 'producer', 'readonly']
  },
  {
    title: '成本分析',
    path: '/help/cost',
    file: 'cost/index.md',
    icon: 'ri-calculator-line',
    roles: ['admin', 'reviewer', 'salesperson', 'readonly'],
    children: [
      { title: '创建成本分析', path: '/help/cost/create', file: 'cost/create.md' },
      { title: '编辑成本分析', path: '/help/cost/edit', file: 'cost/edit.md' },
      { title: '成本对比', path: '/help/cost/compare', file: 'cost/compare.md' },
      { title: '成本记录', path: '/help/cost/records', file: 'cost/records.md' }
    ]
  },
  {
    title: '审核管理',
    path: '/help/review',
    file: 'review/index.md',
    icon: 'ri-shield-check-line',
    roles: ['admin', 'reviewer', 'salesperson'],
    children: [
      { title: '待审核', path: '/help/review/pending', file: 'review/pending.md' },
      { title: '已审核', path: '/help/review/approved', file: 'review/approved.md' }
    ]
  },
  {
    title: '基础数据',
    path: '/help/data',
    file: 'data/index.md',
    icon: 'ri-database-2-line',
    roles: ['admin', 'reviewer', 'salesperson', 'purchaser', 'producer', 'readonly'],
    children: [
      { title: '原料管理', path: '/help/data/material', file: 'data/material.md' },
      { title: '包材管理', path: '/help/data/packaging', file: 'data/packaging.md' },
      { title: '工序管理', path: '/help/data/process', file: 'data/process.md' },
      { title: '型号管理', path: '/help/data/model', file: 'data/model.md' },
      { title: '法规管理', path: '/help/data/regulation', file: 'data/regulation.md' },
      { title: '客户管理', path: '/help/data/customer', file: 'data/customer.md' }
    ]
  },
  {
    title: '系统配置',
    path: '/help/config',
    file: 'config/index.md',
    icon: 'ri-settings-3-line',
    roles: ['admin'],
    children: [
      { title: '系统参数', path: '/help/config/system', file: 'config/system.md' },
      { title: '权限管理', path: '/help/config/permission', file: 'config/permission.md' }
    ]
  },
  {
    title: '常见问题',
    path: '/help/faq',
    file: 'faq/index.md',
    icon: 'ri-question-line',
    roles: ['admin', 'reviewer', 'salesperson', 'purchaser', 'producer', 'readonly'],
    children: [
      { title: '通用问题', path: '/help/faq/common', file: 'faq/common.md' },
      { title: '故障排除', path: '/help/faq/troubleshooting', file: 'faq/troubleshooting.md' }
    ]
  }
]

// 根据角色过滤菜单
export const filterMenuByRole = (menu, role) => {
  return menu
    .filter(item => !item.roles || item.roles.includes(role))
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => !child.roles || child.roles.includes(role))
        }
      }
      return item
    })
}

// 扁平化获取所有文档路径
export const getAllDocPaths = (menu) => {
  const paths = []
  menu.forEach(item => {
    paths.push({ path: item.path, file: item.file, title: item.title })
    if (item.children) {
      item.children.forEach(child => {
        paths.push({ path: child.path, file: child.file, title: child.title })
      })
    }
  })
  return paths
}

// 根据路径查找文档
export const findDocByPath = (menu, path) => {
  for (const item of menu) {
    if (item.path === path) return item
    if (item.children) {
      const child = item.children.find(c => c.path === path)
      if (child) return child
    }
  }
  return null
}

// 获取上一篇/下一篇
export const getPrevNextDoc = (menu, currentPath) => {
  const allPaths = getAllDocPaths(menu)
  const currentIndex = allPaths.findIndex(p => p.path === currentPath)

  return {
    prev: currentIndex > 0 ? allPaths[currentIndex - 1] : null,
    next: currentIndex < allPaths.length - 1 ? allPaths[currentIndex + 1] : null
  }
}
