# 成本分析管理系统 - 实现任务列表

## 阶段 1：项目基础设施搭建

- [x] 1. 初始化项目结构


  - 创建 backend 和 frontend 目录
  - 初始化 Node.js 项目并安装后端依赖
  - 初始化 Vue3 项目并安装前端依赖
  - _需求: 1.1, 2.1_



- [ ] 2. 创建数据库结构
  - 创建 backend/db/database.js 实现 SQLite 连接管理
  - 创建 backend/db/seedData.sql 定义所有数据表结构
  - 实现数据库初始化函数


  - _需求: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 9.1, 12.1_

- [ ] 3. 搭建后端基础架构
  - 创建 backend/server.js 作为 Express 服务器入口
  - 创建 backend/middleware/auth.js 实现 JWT 认证中间件



  - 创建 backend/middleware/errorHandler.js 实现统一错误处理
  - 创建 backend/utils/response.js 实现统一响应格式
  - _需求: 1.1, 1.2, 1.3_

- [ ] 4. 搭建前端基础架构
  - 创建 frontend/src/main.js 作为 Vue 应用入口
  - 配置 frontend/src/router/index.js 路由系统
  - 配置 Pinia 状态管理
  - 配置 Axios 拦截器（请求/响应）
  - 配置 Tailwind CSS
  - _需求: 1.1, 1.2_

## 阶段 2：用户认证与权限系统

- [x] 5. 实现用户认证后端


  - 创建 backend/models/User.js 用户数据模型
  - 创建 backend/controllers/authController.js 认证控制器
  - 创建 backend/routes/authRoutes.js 认证路由
  - 创建 backend/middleware/roleCheck.js 角色权限检查中间件
  - _需求: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_




- [ ] 6. 实现用户认证前端
  - 创建 frontend/src/views/Login.vue 登录页面
  - 创建 frontend/src/store/auth.js 认证状态管理
  - 创建 frontend/src/utils/auth.js Token 管理工具
  - 实现路由守卫
  - 创建 frontend/src/views/user/UserManage.vue 用户管理页面
  - _需求: 1.1, 1.2, 1.10_


## 阶段 3：基础数据管理模块

- [x] 7. 实现法规与型号管理



  - 创建 backend/models/Regulation.js 和 Model.js
  - 创建 backend/controllers/regulationController.js 和 modelController.js
  - 创建对应的路由文件
  - 创建前端管理页面
  - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_




- [ ] 8. 实现原料管理模块
  - 创建 backend/models/Material.js 原料数据模型
  - 创建 backend/controllers/materialController.js 原料控制器
  - 创建 backend/routes/materialRoutes.js 原料路由
  - 创建 backend/utils/excelParser.js Excel 解析工具
  - 创建 frontend/src/views/material/MaterialManage.vue 原料管理页面
  - 创建 frontend/src/components/ExcelUpload.vue Excel 上传组件
  - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 11.1-11.7_

- [ ] 9. 实现工序管理模块
  - 创建 backend/models/Process.js 工序数据模型
  - 创建 backend/controllers/processController.js 工序控制器
  - 创建 backend/routes/processRoutes.js 工序路由
  - 创建 frontend/src/views/process/ProcessManage.vue 工序管理页面
  - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

- [ ] 10. 实现包材管理模块
  - 创建 backend/models/Packaging.js 包材数据模型
  - 创建 backend/controllers/packagingController.js 包材控制器
  - 创建 backend/routes/packagingRoutes.js 包材路由
  - 创建 frontend/src/views/packaging/PackagingManage.vue 包材管理页面
  - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. 实现 Excel 导出功能
  - 创建 backend/utils/excelGenerator.js Excel 生成工具
  - 创建 frontend/src/components/ExcelExport.vue Excel 导出组件
  - _需求: 3.9, 4.8_

## 阶段 4：核心成本计算引擎

- [ ] 12. 实现成本计算工具类
  - 创建 backend/utils/costCalculator.js 成本计算核心类
  - 实现 calculateBaseCost 方法
  - 实现 calculateOverheadPrice 方法
  - 实现 calculateDomesticPrice 方法
  - 实现 calculateExportPrice 方法
  - 实现 calculateInsurancePrice 方法
  - 实现 generateProfitTiers 方法
  - _需求: 6.6, 6.7, 6.8, 6.9, 6.10_

- [ ] 13. 实现系统配置管理
  - 创建 backend/models/SystemConfig.js 系统配置模型
  - 创建 backend/controllers/configController.js 配置控制器
  - 创建 backend/routes/configRoutes.js 配置路由
  - 创建前端系统配置页面
  - _需求: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

- [ ] 14. 实现报价单数据模型
  - 创建 backend/models/Quotation.js 报价单主表模型
  - 创建 backend/models/QuotationItem.js 报价单明细模型
  - _需求: 6.1-6.14_

- [ ] 15. 实现报价单控制器
  - 创建 backend/controllers/costController.js 成本报价控制器
  - 实现 createQuotation 方法
  - 实现 getModelStandardData 方法
  - 实现 calculateQuotation 方法
  - 实现 updateQuotation 方法
  - 实现 submitQuotation 方法
  - 实现 getQuotationList 方法
  - 实现 getQuotationDetail 方法
  - 创建 backend/routes/costRoutes.js 成本报价路由
  - _需求: 6.1-6.14_

## 阶段 5：报价单前端界面

- [ ] 16. 实现报价单创建页面
  - 创建 frontend/src/views/cost/CostAdd.vue 新增报价单页面
  - 实现法规类别和型号选择器
  - 实现内销/外销切换
  - 实现客户信息表单
  - 实现原料/工序/包材表格
  - 实现运费输入和实时计算
  - 实现利润区间报价表展示
  - _需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.11, 6.12, 6.13, 6.14_

- [ ] 17. 实现类 Excel 表格组件
  - 创建 frontend/src/components/CostTable.vue 成本表格组件
  - 实现固定列和可编辑列
  - 实现修改项高亮
  - 实现单元格编辑功能
  - 实现行添加/删除功能
  - _需求: 6.11, 6.14_

- [ ] 18. 实现实时计算功能
  - 创建 frontend/src/composables/useCostCalculation.js 计算逻辑 Hook
  - 实现数据变化监听
  - 实现防抖处理
  - _需求: 6.6, 6.7, 6.8, 6.9, 6.10_

- [ ] 19. 实现报价单记录页面
  - 创建 frontend/src/views/cost/CostRecords.vue 报价单记录页面
  - 实现报价单列表和分页
  - 实现搜索筛选功能
  - 实现查看详情、编辑、删除功能
  - _需求: 12.1, 12.2, 12.3, 12.7_

- [ ] 20. 实现报价单状态管理
  - 创建 frontend/src/store/quotation.js 报价单状态管理
  - _需求: 6.1-6.14_

## 阶段 6：审核流程

- [ ] 21. 实现审核后端逻辑
  - 扩展 backend/controllers/costController.js
  - 实现 getQuotationsForReview 方法
  - 实现 approveQuotation 方法
  - 实现 rejectQuotation 方法
  - 实现 addComment 方法
  - 实现 getQuotationComparison 方法
  - _需求: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ] 22. 实现审核前端界面
  - 创建 frontend/src/views/cost/CostReview.vue 审核页面
  - 实现待审核列表
  - 实现报价单详情展示和修改项高亮
  - 实现标准配置对比视图
  - 实现批注功能
  - 实现通过/退回按钮
  - _需求: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 23. 实现批注系统
  - 创建 backend/models/Comment.js 批注数据模型
  - 创建 frontend/src/components/CommentPanel.vue 批注面板组件
  - _需求: 7.8_

## 阶段 7：报表导出

- [ ] 24. 实现 Excel 导出后端
  - 创建 backend/controllers/reportController.js 报表控制器
  - 创建 backend/routes/reportRoutes.js 报表路由
  - 创建 backend/utils/excelTemplate.js Excel 模板生成器
  - 实现完整的 Excel 样式复刻
  - _需求: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

- [ ] 25. 实现 PDF 导出
  - 创建 backend/utils/pdfGenerator.js PDF 生成器
  - _需求: 8.1, 8.9_

- [ ] 26. 实现前端导出功能
  - 创建 frontend/src/views/report/ReportExport.vue 报表导出页面
  - 实现格式选择和预览功能
  - 扩展 CostRecords.vue 添加导出按钮
  - _需求: 8.1, 8.9_

## 阶段 8：仪表盘与统计

- [ ] 27. 实现统计后端
  - 创建 backend/controllers/dashboardController.js 仪表盘控制器
  - 创建 backend/routes/dashboardRoutes.js 仪表盘路由
  - 实现各类统计查询方法
  - _需求: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 28. 实现仪表盘前端
  - 创建 frontend/src/views/Dashboard.vue 仪表盘页面
  - 集成图表库（ECharts 或 Chart.js）
  - 实现各类统计卡片和图表
  - 实现数据刷新机制
  - _需求: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

## 阶段 9：布局与导航

- [ ] 29. 实现布局组件
  - 创建 frontend/src/layouts/MainLayout.vue 主布局
  - 创建 frontend/src/layouts/Sidebar.vue 侧边导航栏
  - 实现层级折叠结构
  - 实现基于角色的菜单显示
  - _需求: 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [ ] 30. 完善路由配置
  - 完善 frontend/src/router/index.js
  - 实现路由懒加载
  - 实现路由守卫和权限检查
  - 实现面包屑导航
  - _需求: 1.1, 1.2, 1.3_

## 阶段 10：测试与优化

- [ ]* 31. 编写单元测试
  - 后端测试（Jest）
  - 前端测试（Vitest）
  - _需求: 所有需求_

- [ ]* 32. 编写集成测试
  - 完整业务流程测试
  - 权限控制测试
  - _需求: 所有需求_

- [ ] 33. 性能优化
  - 前端优化（懒加载、代码分割、缓存）
  - 后端优化（数据库索引、查询优化）
  - _需求: 所有需求_

- [ ] 34. 用户体验优化
  - 加载状态提示
  - 错误提示优化
  - 表单验证优化
  - 响应式布局调整
  - _需求: 所有需求_

## 阶段 11：部署与文档

- [ ] 35. 配置生产环境
  - 创建 .env.production 配置文件
  - 配置日志系统
  - 配置错误监控
  - _需求: 所有需求_

- [ ] 36. 创建部署脚本
  - 创建 deploy.sh 部署脚本
  - 配置 PM2 进程守护
  - _需求: 所有需求_

- [ ] 37. 编写系统文档
  - 用户手册
  - 开发文档
  - 维护文档
  - _需求: 所有需求_
