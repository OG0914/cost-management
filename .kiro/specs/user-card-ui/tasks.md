# Implementation Plan

- [x] 1. 添加视图切换和筛选状态



  - 在 UserManage.vue 中添加 viewMode、searchText、roleFilter、statusFilter 响应式变量
  - 添加 computed 属性 filteredUsers 实现筛选逻辑
  - _Requirements: 2.1, 2.2, 4.1, 4.2, 4.3_

- [x] 2. 实现工具函数
  - [x] 2.1 创建 getRoleColor() 函数返回角色对应颜色
    - 实现 ROLE_COLORS 映射对象
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [ ]* 2.2 编写 getRoleColor 属性测试
    - **Property 1: Role badge color mapping**
    - **Validates: Requirements 1.4, 6.1-6.6**
  - [x] 2.3 创建 getInitial() 函数获取姓名首字母
    - 处理中文和英文姓名
    - _Requirements: 1.2_
  - [x] 2.4 创建 getStatusClass() 函数返回状态样式类
    - _Requirements: 1.6_
  - [ ]* 2.5 编写状态指示器属性测试
    - **Property 2: Status indicator consistency**
    - **Validates: Requirements 1.6**

- [x] 3. 实现筛选逻辑



  - [x] 3.1 实现 filterUsers computed 属性


    - 支持搜索、角色筛选、状态筛选组合
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 3.2 编写搜索筛选属性测试
    - **Property 3: Search filter correctness**
    - **Validates: Requirements 4.1**
  - [ ]* 3.3 编写角色筛选属性测试
    - **Property 4: Role filter correctness**
    - **Validates: Requirements 4.2**
  - [ ]* 3.4 编写状态筛选属性测试
    - **Property 5: Status filter correctness**
    - **Validates: Requirements 4.3**

- [x] 4. 实现页面头部区域



  - 添加搜索输入框
  - 添加视图切换按钮组（Grid/List 图标）
  - 保留新增用户按钮
  - _Requirements: 2.1, 2.2, 4.1_

- [x] 5. 实现筛选区域



  - 添加角色筛选下拉框（全部角色 + 6种角色）
  - 添加状态筛选下拉框（全部/已启用/已禁用）
  - _Requirements: 4.2, 4.3_

- [x] 6. 实现卡片视图

  - [x] 6.1 创建用户卡片模板
    - 头像区域（首字母圆形头像）
    - 用户信息区域（代号、姓名垂直排列）
    - 角色徽章（彩色 el-tag）
    - 邮箱显示
    - 状态指示器（圆点 + 文字）
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 6.2 创建卡片操作栏
    - 重置密码按钮（Key 图标）
    - 编辑按钮（EditPen 图标）
    - 删除按钮（Delete 图标，admin 禁用）
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 6.3 实现响应式网格布局
    - 使用 CSS Grid 或 TailwindCSS
    - 4列(≥1200px) / 3列(992-1199px) / 2列(768-991px) / 1列(<768px)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. 实现列表视图
  - 保留原有 el-table 结构
  - 更新操作列使用图标按钮（Key、EditPen、Delete）
  - 添加状态列显示圆点指示器
  - _Requirements: 2.3_

- [x] 8. 实现视图切换逻辑
  - [x] 8.1 绑定视图切换按钮事件

    - 切换 viewMode 状态
    - _Requirements: 2.1, 2.2_
  - [ ]* 8.2 编写视图切换状态保持属性测试
    - **Property 6: View switch state preservation**
    - **Validates: Requirements 2.4**

- [x] 9. 样式优化



  - 卡片悬停效果（阴影、边框）
  - 头像背景色根据角色变化
  - 操作按钮悬停高亮
  - 视图切换按钮选中状态
  - _Requirements: 1.1_

- [ ] 10. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
