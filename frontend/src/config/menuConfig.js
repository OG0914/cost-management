/**
 * 菜单配置
 * 定义系统侧边栏菜单结构
 */

export const menuConfig = [
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: 'ri-dashboard-3-line',
    route: '/dashboard'
  },

  // 分割线：成本数据
  { type: 'divider', label: '成本数据' },

  {
    id: 'cost',
    label: '成本管理',
    icon: 'ri-money-cny-box-line',
    // 采购和生产人员不能访问
    roles: ['admin', 'reviewer', 'salesperson', 'readonly'],
    children: [
      { id: 'cost_add', label: '新增报价', route: '/cost/add' },
      { id: 'cost_standard', label: '标准成本', route: '/cost/standard' },
      { id: 'cost_records', label: '成本记录', route: '/cost/records' }
    ]
  },
  {
    id: 'review',
    label: '审核管理',
    icon: 'ri-checkbox-circle-line',
    // 管理员、审核人员和业务员可见（业务员只能看自己的）
    roles: ['admin', 'reviewer', 'salesperson'],
    children: [
      { id: 'review_pending', label: '待审核记录', route: '/review/pending' },
      { id: 'review_approved', label: '已审核记录', route: '/review/approved' }
    ]
  },

  // 分割线：基础数据
  { type: 'divider', label: '基础数据' },

  {
    id: 'regulation',
    label: '法规管理',
    icon: 'ri-government-line',
    route: '/regulations',
    roles: ['admin']
  },
  {
    id: 'model',
    label: '型号管理',
    icon: 'ri-price-tag-3-line',
    route: '/models',
    roles: ['admin']
  },
  {
    id: 'material',
    label: '原料管理',
    icon: 'ri-stack-line',
    route: '/materials'
  },
  {
    id: 'packaging',
    label: '包材管理',
    icon: 'ri-box-3-line',
    route: '/packaging'
  },
  {
    id: 'process',
    label: '工序管理',
    icon: 'ri-settings-4-line',
    route: '/processes'
  },

  // 分割线：系统管理
  { type: 'divider', label: '系统管理' },

  {
    id: 'config',
    label: '系统配置',
    icon: 'ri-equalizer-line',
    route: '/config'
  },
  {
    id: 'user',
    label: '用户管理',
    icon: 'ri-user-settings-line',
    route: '/users',
    roles: ['admin']
  }
]

/**
 * 根据用户角色过滤菜单
 * @param {Array} menuItems - 菜单配置数组
 * @param {string} userRole - 用户角色
 * @returns {Array} 过滤后的菜单数组
 */
export function filterMenuByRole(menuItems, userRole) {
  if (!userRole) return []

  return menuItems.filter(item => {
    // 分割线始终显示
    if (item.type === 'divider') {
      return true
    }

    // 采购和生产人员不能看到成本管理
    if ((userRole === 'purchaser' || userRole === 'producer') && item.id === 'cost') {
      return false
    }

    // 检查角色权限：如果菜单项定义了 roles，则用户角色必须在列表中
    if (item.roles && !item.roles.includes(userRole)) {
      return false
    }

    return true
  })
}

/**
 * 查找菜单项
 * @param {Array} menuItems - 菜单配置数组
 * @param {string} menuId - 菜单 ID
 * @returns {Object|null} 菜单项或 null
 */
export function findMenuItem(menuItems, menuId) {
  for (const item of menuItems) {
    if (item.id === menuId) return item
    if (item.children) {
      const sub = item.children.find(s => s.id === menuId)
      if (sub) return sub
    }
  }
  return null
}

/**
 * 角色名称映射
 */
export const roleNameMap = {
  admin: '管理员',
  purchaser: '采购人员',
  producer: '生产人员',
  reviewer: '审核人员',
  salesperson: '业务员',
  readonly: '只读用户'
}

/**
 * 获取角色中文名称
 * @param {string} role - 角色标识
 * @returns {string} 角色中文名称
 */
export function getRoleName(role) {
  return roleNameMap[role] || '-'
}
