# Implementation Plan

- [x] 1. 为包材管理页面添加卡片视图功能



  - [x] 1.1 添加视图切换状态和按钮

    - 在 PackagingManage.vue 中添加 viewMode ref 状态
    - 在筛选栏最右边添加视图切换按钮组
    - 导入 Grid 和 List 图标
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 实现卡片视图模板


    - 创建卡片容器和响应式网格布局
    - 实现单个配置卡片组件，包含头部（型号、配置名、类别圆形）、内容区、操作栏
    - 使用 v-if 条件渲染卡片视图和列表视图
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 1.3 添加卡片视图样式

    - 添加筛选栏 flex 布局样式，视图切换按钮靠右
    - 添加卡片网格响应式样式（4列/3列/2列/1列）
    - 添加卡片头部、内容区、操作栏样式
    - 添加产品类别圆形标识样式
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 1.4 处理视图切换时的选择状态


    - 监听 viewMode 变化，切换到卡片视图时清空 selectedConfigs
    - 卡片视图下隐藏批量选择相关功能
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. 为工序管理页面添加卡片视图功能


  - [x] 2.1 添加视图切换状态和按钮


    - 在 ProcessManage.vue 中添加 viewMode ref 状态
    - 在筛选栏最右边添加视图切换按钮组
    - 导入 Grid 和 List 图标
    - _Requirements: 2.1, 2.4_

  - [x] 2.2 实现卡片视图模板
    - 创建卡片容器和响应式网格布局
    - 实现单个配置卡片组件，包含头部（型号、配置名、类别圆形）、内容区、操作栏
    - 使用 v-if 条件渲染卡片视图和列表视图
    - 注意工序管理显示的是工序总价而非包材总价
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 2.3 添加卡片视图样式


    - 复用包材管理的卡片样式
    - 确保样式一致性
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 2.4 处理视图切换时的选择状态
    - 监听 viewMode 变化，切换到卡片视图时清空 selectedConfigs
    - 卡片视图下隐藏批量选择相关功能
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. 添加产品类别颜色映射工具函数



  - [x] 3.1 创建类别颜色映射配置

    - 在合适的位置（如 utils 或 config）添加 CATEGORY_COLORS 映射
    - 实现 getCategoryColor 函数
    - _Requirements: 3.2_

- [x] 4. Checkpoint - 确保所有功能正常工作

  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 5. 编写属性测试
  - [ ]* 5.1 编写筛选结果一致性属性测试
    - **Property 1: 筛选结果一致性**
    - **Validates: Requirements 4.1, 4.2**
  - [ ]* 5.2 编写分页数据完整性属性测试
    - **Property 2: 分页数据完整性**
    - **Validates: Requirements 4.3**
  - [ ]* 5.3 编写视图切换状态保持属性测试
    - **Property 3: 视图切换状态保持**
    - **Validates: Requirements 1.2, 1.3, 2.2, 2.3**

- [x] 6. Final Checkpoint - 确保所有测试通过


  - Ensure all tests pass, ask the user if questions arise.
