# 成本分析管理系统 - 设计文档

## 概述

本文档详细描述成本分析管理系统的技术架构、开发阶段规划、数据模型设计和实现策略。系统采用前后端分离架构，使用 Vue3 + Express + SQLite 技术栈，严格遵循 README 中定义的项目文件结构。

### 系统目标

- 取代 Excel 人工审核流程，实现自动化成本计算
- 支持 6 种用户角色的权限管理
- 提供类 Excel 的用户界面体验
- 实现标准化的数据导入导出流程
- 确保计算逻辑的一致性和准确性

---

## 开发阶段规划

### 阶段 1：项目基础设施搭建（第 1-2 周）

**目标：** 建立项目骨架，配置开发环境，初始化数据库

**实现内容：**

#### 1.1 项目结构初始化
- 创建 `backend/` 和 `frontend/` 目录
- 初始化 Node.js 项目（`npm init`）
- 安装核心依赖：
  - 后端：express, better-sqlite3, cors, dotenv, bcrypt, jsonwebtoken
  - 前端：vue, vue-router, pinia, element-plus, tailwindcss, axios

#### 1.2 数据库设计与初始化
- 创建 `backend/db/database.js` - SQLite 连接管理
- 创建 `backend/db/seedData.sql` - 数据库表结构
- 实现数据表：
  - `users` - 用户表
  - `regulations` - 法规类别表
  - `models` - 型号表
  - `materials` - 原料表
  - `processes` - 工序表
  - `packaging` - 包材表
  - `quotations` - 报价单主表
  - `quotation_items` - 报价单明细表
  - `system_config` - 系统配置表
  - `price_history` - 价格历史表

#### 1.3 后端基础架构
- 创建 `backend/server.js` - Express 服务器入口
- 创建 `backend/middleware/auth.js` - JWT 认证中间件
- 创建 `backend/middleware/errorHandler.js` - 统一错误处理
- 创建 `backend/utils/response.js` - 统一响应格式

#### 1.4 前端基础架构
- 创建 `frontend/src/main.js` - Vue 应用入口
- 配置 `frontend/src/router/index.js` - 路由系统
- 配置 Pinia 状态管理
- 配置 Axios 拦截器（请求/响应）
- 配置 Tailwind CSS

**交付物：**
- 可运行的前后端项目骨架
- 完整的数据库表结构
- 基础的中间件和工具函数

---

### 阶段 2：用户认证与权限系统（第 3 周）

**目标：** 实现完整的用户登录、注册和基于角色的权限控制

**实现内容：**

#### 2.1 后端实现
- 创建 `backend/models/User.js` - 用户数据模型
- 创建 `backend/controllers/authController.js` - 认证控制器
  - 用户登录（JWT 生成）
  - 用户注册（密码加密）
  - Token 验证
  - 密码重置
- 创建 `backend/routes/authRoutes.js` - 认证路由
- 创建 `backend/middleware/roleCheck.js` - 角色权限检查中间件

#### 2.2 前端实现
- 创建 `frontend/src/views/Login.vue` - 登录页面
- 创建 `frontend/src/store/auth.js` - 认证状态管理
- 创建 `frontend/src/utils/auth.js` - Token 管理工具
- 实现路由守卫（未登录跳转）
- 创建 `frontend/src/views/user/UserManage.vue` - 用户管理页面（管理员）

#### 2.3 权限矩阵实现
- 管理员：全部权限
- 采购：原料模块读写
- 生产：工序模块读写
- 审核人：报价单审核、导出
- 业务员：报价单增删改查
- 只读：仅查看和导出

**交付物：**
- 完整的登录/注册功能
- 基于角色的权限控制系统
- 用户管理界面

**文件结构对应：**
```
backend/
├── routes/authRoutes.js
├── controllers/authController.js
├── models/User.js
└── middleware/roleCheck.js

frontend/
└── src/
    ├── views/
    │   ├── Login.vue
    │   └── user/UserManage.vue
    └── store/auth.js
```

---

### 阶段 3：基础数据管理模块（第 4-5 周）

**目标：** 实现法规、型号、原料、工序、包材的 CRUD 和 Excel 导入导出

**实现内容：**

#### 3.1 法规与型号管理
- 创建 `backend/models/Regulation.js` - 法规数据模型
- 创建 `backend/models/Model.js` - 型号数据模型
- 创建 `backend/controllers/regulationController.js` - 法规控制器
- 创建 `backend/controllers/modelController.js` - 型号控制器
- 创建 `backend/routes/regulationRoutes.js` - 法规路由
- 创建 `backend/routes/modelRoutes.js` - 型号路由
- 前端：创建法规型号管理页面（管理员专用）

#### 3.2 原料管理模块
- 创建 `backend/models/Material.js` - 原料数据模型
- 创建 `backend/controllers/materialController.js` - 原料控制器
  - CRUD 操作
  - Excel 导入解析（使用 xlsx 库）
  - Excel 导出生成
  - 价格历史记录
- 创建 `backend/routes/materialRoutes.js` - 原料路由
- 创建 `backend/utils/excelParser.js` - Excel 解析工具
- 创建 `frontend/src/views/material/MaterialManage.vue` - 原料管理页面
  - 表格展示（Element Plus Table）
  - 搜索筛选
  - 新增/编辑对话框
  - Excel 导入/导出按钮

#### 3.3 工序管理模块
- 创建 `backend/models/Process.js` - 工序数据模型
- 创建 `backend/controllers/processController.js` - 工序控制器
- 创建 `backend/routes/processRoutes.js` - 工序路由
- 创建 `frontend/src/views/process/ProcessManage.vue` - 工序管理页面

#### 3.4 包材管理模块
- 创建 `backend/models/Packaging.js` - 包材数据模型
- 创建 `backend/controllers/packagingController.js` - 包材控制器
- 创建 `backend/routes/packagingRoutes.js` - 包材路由
- 创建 `frontend/src/views/packaging/PackagingManage.vue` - 包材管理页面

#### 3.5 Excel 导入导出通用组件
- 创建 `frontend/src/components/ExcelUpload.vue` - Excel 上传组件
- 创建 `frontend/src/components/ExcelExport.vue` - Excel 导出组件
- 创建 `backend/utils/excelGenerator.js` - Excel 生成工具

**交付物：**
- 完整的基础数据管理功能
- Excel 导入导出功能
- 价格历史追溯功能

**文件结构对应：**
```
backend/
├── models/
│   ├── Regulation.js
│   ├── Model.js
│   ├── Material.js
│   ├── Process.js
│   └── Packaging.js
├── controllers/
│   ├── materialController.js
│   ├── processController.js
│   └── packagingController.js
├── routes/
│   ├── materialRoutes.js
│   ├── processRoutes.js
│   └── packagingRoutes.js
└── utils/
    ├── excelParser.js
    └── excelGenerator.js

frontend/
└── src/
    ├── views/
    │   ├── material/MaterialManage.vue
    │   ├── process/ProcessManage.vue
    │   └── packaging/PackagingManage.vue
    └── components/
        ├── ExcelUpload.vue
        └── ExcelExport.vue
```

---

### 阶段 4：核心成本计算引擎（第 6-7 周）

**目标：** 实现自动化成本计算逻辑和报价单生成功能

**实现内容：**

#### 4.1 成本计算工具类
- 创建 `backend/utils/costCalculator.js` - 成本计算核心类
  - `calculateBaseCost()` - 计算成本价（原料 + 工价 + 包材 + 运费）
  - `calculateOverheadPrice()` - 计算管销价（成本价 ÷ 0.8）
  - `calculateDomesticPrice()` - 计算内销价（管销价 × 1.13）
  - `calculateExportPrice()` - 计算外销价（管销价 ÷ 汇率）
  - `calculateInsurancePrice()` - 计算保险价（外销价 × 1.003）
  - `generateProfitTiers()` - 生成利润区间报价（5%, 10%, 25%, 50%）

#### 4.2 系统配置管理
- 创建 `backend/models/SystemConfig.js` - 系统配置模型
- 创建 `backend/controllers/configController.js` - 配置控制器
  - 管销率配置（默认 0.2）
  - 增值税率配置（默认 0.13）
  - 保险率配置（默认 0.003）
  - 汇率配置（默认 7.2）
  - 利润区间配置（默认 [0.05, 0.10, 0.25, 0.50]）
- 创建 `backend/routes/configRoutes.js` - 配置路由
- 前端：创建系统配置页面（管理员专用）

#### 4.3 报价单数据模型
- 创建 `backend/models/Quotation.js` - 报价单主表模型
  - 客户信息
  - 型号信息
  - 数量、运费
  - 计算结果
  - 状态（草稿/已提交/已审核/已退回）
- 创建 `backend/models/QuotationItem.js` - 报价单明细模型
  - 原料明细
  - 工序明细
  - 包材明细
  - 修改标记（is_changed）

#### 4.4 报价单控制器
- 创建 `backend/controllers/costController.js` - 成本报价控制器
  - `createQuotation()` - 创建报价单
  - `getModelStandardData()` - 获取型号标准配置
  - `calculateQuotation()` - 执行成本计算
  - `updateQuotation()` - 更新报价单
  - `submitQuotation()` - 提交审核
  - `getQuotationList()` - 获取报价单列表
  - `getQuotationDetail()` - 获取报价单详情
- 创建 `backend/routes/costRoutes.js` - 成本报价路由

**交付物：**
- 完整的成本计算引擎
- 系统配置管理功能
- 报价单数据模型和 API

**文件结构对应：**
```
backend/
├── models/
│   ├── Quotation.js
│   ├── QuotationItem.js
│   └── SystemConfig.js
├── controllers/
│   ├── costController.js
│   └── configController.js
├── routes/
│   ├── costRoutes.js
│   └── configRoutes.js
└── utils/
    └── costCalculator.js
```

---

### 阶段 5：报价单前端界面（第 8-9 周）

**目标：** 实现类 Excel 的报价单创建和编辑界面

**实现内容：**

#### 5.1 报价单创建页面
- 创建 `frontend/src/views/cost/CostAdd.vue` - 新增报价单页面
  - 法规类别选择器
  - 型号选择器（级联）
  - 内销/外销切换
  - 客户信息表单
  - 原料表格（自动加载 + 可编辑）
  - 工序表格（自动加载 + 可编辑）
  - 包材表格（自动加载 + 可编辑）
  - 运费输入
  - 实时计算结果展示
  - 利润区间报价表

#### 5.2 类 Excel 表格组件
- 创建 `frontend/src/components/CostTable.vue` - 成本表格组件
  - 使用 Element Plus Table
  - 固定列不可编辑（灰色背景）
  - 可编辑列（白色背景）
  - 修改项高亮（蓝色背景）
  - 单元格编辑功能
  - 行添加/删除功能

#### 5.3 实时计算功能
- 创建 `frontend/src/composables/useCostCalculation.js` - 计算逻辑 Hook
  - 监听数据变化
  - 调用后端计算 API
  - 更新界面显示
  - 防抖处理

#### 5.4 报价单记录页面
- 创建 `frontend/src/views/cost/CostRecords.vue` - 报价单记录页面
  - 报价单列表（分页）
  - 搜索筛选（客户、型号、日期、状态）
  - 查看详情
  - 编辑草稿
  - 删除报价单
  - 导出报价单

#### 5.5 状态管理
- 创建 `frontend/src/store/quotation.js` - 报价单状态管理
  - 当前报价单数据
  - 标准配置缓存
  - 计算结果缓存

**交付物：**
- 完整的报价单创建界面
- 类 Excel 的用户体验
- 实时计算功能
- 报价单列表和查询功能

**文件结构对应：**
```
frontend/
└── src/
    ├── views/
    │   └── cost/
    │       ├── CostAdd.vue
    │       └── CostRecords.vue
    ├── components/
    │   └── CostTable.vue
    ├── composables/
    │   └── useCostCalculation.js
    └── store/
        └── quotation.js
```

---

### 阶段 6：审核流程（第 10 周）

**目标：** 实现报价单审核、批注和退回功能

**实现内容：**

#### 6.1 审核后端逻辑
- 扩展 `backend/controllers/costController.js`
  - `getQuotationsForReview()` - 获取待审核报价单列表
  - `approveQuotation()` - 审核通过
  - `rejectQuotation()` - 审核退回
  - `addComment()` - 添加批注
  - `getQuotationComparison()` - 获取标准配置对比数据

#### 6.2 审核前端界面
- 创建 `frontend/src/views/cost/CostReview.vue` - 审核页面
  - 待审核列表
  - 报价单详情展示
  - 修改项高亮显示（蓝色背景）
  - 标准配置对比视图
  - 批注输入框
  - 通过/退回按钮

#### 6.3 批注系统
- 创建 `backend/models/Comment.js` - 批注数据模型
- 创建 `frontend/src/components/CommentPanel.vue` - 批注面板组件
  - 批注列表
  - 添加批注
  - 批注气泡显示

#### 6.4 状态流转
- 草稿 → 已提交（业务员提交）
- 已提交 → 已审核（审核人通过）
- 已提交 → 已退回（审核人退回）
- 已退回 → 已提交（业务员修改后重新提交）

**交付物：**
- 完整的审核流程
- 批注功能
- 状态流转机制
- 差异对比功能

**文件结构对应：**
```
backend/
├── models/Comment.js
└── controllers/costController.js (扩展)

frontend/
└── src/
    ├── views/cost/CostReview.vue
    └── components/CommentPanel.vue
```

---

### 阶段 7：报表导出（第 11 周）

**目标：** 实现 Excel 和 PDF 格式的报价单导出，完全复刻原 Excel 样式

**实现内容：**

#### 7.1 Excel 导出后端
- 创建 `backend/controllers/reportController.js` - 报表控制器
  - `exportQuotationExcel()` - 导出 Excel
  - `exportQuotationPDF()` - 导出 PDF
- 创建 `backend/routes/reportRoutes.js` - 报表路由
- 创建 `backend/utils/excelTemplate.js` - Excel 模板生成器
  - 使用 ExcelJS 库
  - 复刻原 Excel 样式
  - 表头：客户信息、型号、法规类别
  - 表体：原料/工价/包材分区
  - 尾部：利润区间报价表
  - 单元格合并
  - 颜色格式
  - 边框样式

#### 7.2 PDF 导出
- 安装 puppeteer 或 pdfkit
- 创建 `backend/utils/pdfGenerator.js` - PDF 生成器
  - HTML 模板渲染
  - 转换为 PDF

#### 7.3 前端导出功能
- 创建 `frontend/src/views/report/ReportExport.vue` - 报表导出页面
  - 报价单选择
  - 格式选择（Excel/PDF）
  - 预览功能
  - 下载按钮
- 扩展 `frontend/src/views/cost/CostRecords.vue`
  - 添加导出按钮

**交付物：**
- Excel 导出功能（完全复刻样式）
- PDF 导出功能
- 报表预览功能

**文件结构对应：**
```
backend/
├── controllers/reportController.js
├── routes/reportRoutes.js
└── utils/
    ├── excelTemplate.js
    └── pdfGenerator.js

frontend/
└── src/
    └── views/report/ReportExport.vue
```

---

### 阶段 8：仪表盘与统计（第 12 周）

**目标：** 实现数据可视化仪表盘，展示关键业务指标

**实现内容：**

#### 8.1 统计后端
- 创建 `backend/controllers/dashboardController.js` - 仪表盘控制器
  - `getQuotationStats()` - 报价统计
  - `getAverageReviewTime()` - 平均审核时长
  - `getCostTrends()` - 成本趋势
  - `getPendingCount()` - 待审核数量
  - `getStatusDistribution()` - 状态分布
- 创建 `backend/routes/dashboardRoutes.js` - 仪表盘路由

#### 8.2 仪表盘前端
- 创建 `frontend/src/views/Dashboard.vue` - 仪表盘页面
  - 使用 ECharts 或 Chart.js
  - 报价次数卡片
  - 平均审核时长卡片
  - 待审核数量卡片
  - 成本趋势图表
  - 状态分布饼图
  - 型号成本对比柱状图

#### 8.3 数据刷新
- 实时数据更新
- 定时刷新机制
- 手动刷新按钮

**交付物：**
- 完整的仪表盘功能
- 数据可视化图表
- 关键指标展示

**文件结构对应：**
```
backend/
├── controllers/dashboardController.js
└── routes/dashboardRoutes.js

frontend/
└── src/
    └── views/Dashboard.vue
```

---

### 阶段 9：布局与导航（第 13 周）

**目标：** 实现统一的页面布局和侧边导航栏

**实现内容：**

#### 9.1 布局组件
- 创建 `frontend/src/layouts/MainLayout.vue` - 主布局
  - 顶部导航栏（用户信息、退出登录）
  - 侧边导航栏
  - 内容区域
- 创建 `frontend/src/layouts/Sidebar.vue` - 侧边导航栏
  - 层级折叠结构
  - 图标 + 文字
  - 路由跳转
  - 权限控制（根据角色显示菜单）

#### 9.2 导航结构
```
📊 仪表盘
├─ 成本管理
│   ├─ 新增成本
│   ├─ 成本记录
│   └─ 审核报价单（审核人专用）
├─ 基础数据
│   ├─ 法规管理（管理员）
│   ├─ 型号管理（管理员）
│   ├─ 原料管理（采购）
│   ├─ 工序管理（生产）
│   └─ 包材管理（管理员）
├─ 报表导出
├─ 系统设置
│   ├─ 系统配置（管理员）
│   └─ 用户管理（管理员）
```

#### 9.3 路由配置
- 完善 `frontend/src/router/index.js`
  - 路由懒加载
  - 路由守卫（权限检查）
  - 面包屑导航

**交付物：**
- 统一的页面布局
- 侧边导航栏
- 完整的路由系统

**文件结构对应：**
```
frontend/
└── src/
    ├── layouts/
    │   ├── MainLayout.vue
    │   └── Sidebar.vue
    └── router/index.js
```

---

### 阶段 10：测试与优化（第 14-15 周）

**目标：** 进行全面测试、性能优化和 Bug 修复

**实现内容：**

#### 10.1 单元测试
- 后端测试（使用 Jest）
  - 成本计算逻辑测试
  - API 接口测试
  - 数据模型测试
- 前端测试（使用 Vitest）
  - 组件测试
  - 状态管理测试
  - 工具函数测试

#### 10.2 集成测试
- 完整业务流程测试
  - 用户登录 → 创建报价单 → 提交审核 → 审核通过 → 导出报价单
  - Excel 导入 → 数据验证 → 保存成功
  - 权限控制测试

#### 10.3 性能优化
- 前端优化
  - 组件懒加载
  - 图片压缩
  - 代码分割
  - 缓存策略
- 后端优化
  - 数据库索引优化
  - 查询优化
  - 接口响应时间优化
  - 并发处理

#### 10.4 用户体验优化
- 加载状态提示
- 错误提示优化
- 表单验证优化
- 响应式布局调整

**交付物：**
- 测试报告
- 性能优化报告
- Bug 修复列表

---

### 阶段 11：部署与文档（第 16 周）

**目标：** 完成系统部署和文档编写

**实现内容：**

#### 11.1 生产环境配置
- 创建 `.env.production` 配置文件
- 配置生产数据库路径
- 配置日志系统
- 配置错误监控

#### 11.2 部署脚本
- 创建 `deploy.sh` 部署脚本
- 前端构建（`npm run build`）
- 后端启动脚本
- 进程守护（PM2）

#### 11.3 文档编写
- 用户手册
  - 各角色操作指南
  - 常见问题解答
- 开发文档
  - API 接口文档
  - 数据库设计文档
  - 部署文档
- 维护文档
  - 备份恢复流程
  - 故障排查指南

#### 11.4 培训与交付
- 用户培训
- 系统演示
- 正式交付

**交付物：**
- 生产环境部署
- 完整的系统文档
- 用户培训材料

---

## 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器客户端                          │
│                   (Vue3 + Element Plus)                  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/HTTPS
                      │ (Axios)
┌─────────────────────▼───────────────────────────────────┐
│                   Express 服务器                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              路由层 (Routes)                       │   │
│  │  auth | cost | material | process | packaging    │   │
│  │  report | dashboard | config                     │   │
│  └──────────────────┬───────────────────────────────┘   │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │            中间件层 (Middleware)                   │   │
│  │  JWT认证 | 权限检查 | 错误处理 | 日志记录          │   │
│  └──────────────────┬───────────────────────────────┘   │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │            控制器层 (Controllers)                  │   │
│  │  业务逻辑处理 | 数据验证 | 响应格式化               │   │
│  └──────────────────┬───────────────────────────────┘   │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │             模型层 (Models)                        │   │
│  │  数据模型定义 | 数据库操作封装                      │   │
│  └──────────────────┬───────────────────────────────┘   │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │            工具层 (Utils)                          │   │
│  │  成本计算 | Excel处理 | PDF生成 | 响应格式         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                SQLite 数据库                              │
│              (better-sqlite3)                            │
└─────────────────────────────────────────────────────────┘
```

### 前端架构

```
frontend/
├── src/
│   ├── main.js                    # 应用入口
│   ├── App.vue                    # 根组件
│   ├── router/                    # 路由配置
│   │   └── index.js
│   ├── store/                     # Pinia 状态管理
│   │   ├── auth.js               # 认证状态
│   │   ├── quotation.js          # 报价单状态
│   │   └── config.js             # 系统配置状态
│   ├── layouts/                   # 布局组件
│   │   ├── MainLayout.vue
│   │   └── Sidebar.vue
│   ├── views/                     # 页面组件
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── cost/
│   │   │   ├── CostAdd.vue
│   │   │   ├── CostRecords.vue
│   │   │   └── CostReview.vue
│   │   ├── material/
│   │   │   └── MaterialManage.vue
│   │   ├── process/
│   │   │   └── ProcessManage.vue
│   │   ├── packaging/
│   │   │   └── PackagingManage.vue
│   │   ├── report/
│   │   │   └── ReportExport.vue
│   │   └── user/
│   │       └── UserManage.vue
│   ├── components/                # 可复用组件
│   │   ├── CostTable.vue
│   │   ├── ExcelUpload.vue
│   │   ├── ExcelExport.vue
│   │   └── CommentPanel.vue
│   ├── composables/               # 组合式函数
│   │   └── useCostCalculation.js
│   ├── utils/                     # 工具函数
│   │   ├── request.js            # Axios 封装
│   │   ├── auth.js               # Token 管理
│   │   └── format.js             # 格式化工具
│   └── styles/                    # 全局样式
│       ├── index.css
│       └── tailwind.css
└── package.json
```

### 后端架构

```
backend/
├── server.js                      # Express 入口
├── db/
│   ├── database.js               # SQLite 连接
│   └── seedData.sql              # 初始化脚本
├── routes/                        # 路由定义
│   ├── authRoutes.js
│   ├── costRoutes.js
│   ├── materialRoutes.js
│   ├── processRoutes.js
│   ├── packagingRoutes.js
│   ├── reportRoutes.js
│   ├── dashboardRoutes.js
│   ├── configRoutes.js
│   ├── regulationRoutes.js
│   └── modelRoutes.js
├── controllers/                   # 控制器
│   ├── authController.js
│   ├── costController.js
│   ├── materialController.js
│   ├── processController.js
│   ├── packagingController.js
│   ├── reportController.js
│   ├── dashboardController.js
│   ├── configController.js
│   ├── regulationController.js
│   └── modelController.js
├── models/                        # 数据模型
│   ├── User.js
│   ├── Regulation.js
│   ├── Model.js
│   ├── Material.js
│   ├── Process.js
│   ├── Packaging.js
│   ├── Quotation.js
│   ├── QuotationItem.js
│   ├── Comment.js
│   └── SystemConfig.js
├── middleware/                    # 中间件
│   ├── auth.js                   # JWT 认证
│   ├── roleCheck.js              # 权限检查
│   └── errorHandler.js           # 错误处理
└── utils/                         # 工具函数
    ├── costCalculator.js         # 成本计算
    ├── excelParser.js            # Excel 解析
    ├── excelGenerator.js         # Excel 生成
    ├── excelTemplate.js          # Excel 模板
    ├── pdfGenerator.js           # PDF 生成
    └── response.js               # 响应格式
```

---

## 数据模型设计

### 数据库表结构

#### 1. users（用户表）

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly')),
  real_name TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. regulations（法规类别表）

```sql
CREATE TABLE regulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. models（型号表）

```sql
CREATE TABLE models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  regulation_id INTEGER NOT NULL,
  model_name TEXT NOT NULL,
  remark TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (regulation_id) REFERENCES regulations(id)
);
```

#### 4. materials（原料表）

```sql
CREATE TABLE materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  model_id INTEGER,
  usage_amount REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);
```

#### 5. processes（工序表）

```sql
CREATE TABLE processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  model_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);
```

#### 6. packaging（包材表）

```sql
CREATE TABLE packaging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  usage_amount REAL NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  model_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);
```

#### 7. quotations（报价单主表）

```sql
CREATE TABLE quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_region TEXT NOT NULL,
  model_id INTEGER NOT NULL,
  regulation_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  freight_total REAL NOT NULL,
  freight_per_unit REAL NOT NULL,
  sales_type TEXT NOT NULL CHECK(sales_type IN ('domestic', 'export')),
  base_cost REAL NOT NULL,
  overhead_price REAL NOT NULL,
  final_price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_by INTEGER NOT NULL,
  reviewed_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME,
  reviewed_at DATETIME,
  FOREIGN KEY (model_id) REFERENCES models(id),
  FOREIGN KEY (regulation_id) REFERENCES regulations(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
```

#### 8. quotation_items（报价单明细表）

```sql
CREATE TABLE quotation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('material', 'process', 'packaging')),
  item_name TEXT NOT NULL,
  usage_amount REAL NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  is_changed BOOLEAN DEFAULT 0,
  original_value REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);
```

#### 9. comments（批注表）

```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 10. system_config（系统配置表）

```sql
CREATE TABLE system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初始配置数据
INSERT INTO system_config (config_key, config_value, description) VALUES
('overhead_rate', '0.2', '管销率'),
('vat_rate', '0.13', '增值税率'),
('insurance_rate', '0.003', '保险率'),
('exchange_rate', '7.2', '汇率（CNY/USD）'),
('profit_tiers', '[0.05, 0.10, 0.25, 0.50]', '利润区间');
```

#### 11. price_history（价格历史表）

```sql
CREATE TABLE price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL CHECK(item_type IN ('material', 'process', 'packaging')),
  item_id INTEGER NOT NULL,
  old_price REAL NOT NULL,
  new_price REAL NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

### 数据关系图

```
users (用户)
  ├─ created_by → quotations (创建的报价单)
  ├─ reviewed_by → quotations (审核的报价单)
  └─ user_id → comments (批注)

regulations (法规类别)
  ├─ regulation_id → models (型号)
  └─ regulation_id → quotations (报价单)

models (型号)
  ├─ model_id → materials (原料)
  ├─ model_id → processes (工序)
  ├─ model_id → packaging (包材)
  └─ model_id → quotations (报价单)

quotations (报价单)
  ├─ quotation_id → quotation_items (明细)
  └─ quotation_id → comments (批注)
```

---

## 核心组件接口设计

### 1. 成本计算器（CostCalculator）

```javascript
class CostCalculator {
  constructor(config) {
    this.overheadRate = config.overhead_rate;
    this.vatRate = config.vat_rate;
    this.insuranceRate = config.insurance_rate;
    this.exchangeRate = config.exchange_rate;
    this.profitTiers = config.profit_tiers;
  }

  // 计算成本价
  calculateBaseCost(materials, processes, packaging, freight) {
    const materialCost = materials.reduce((sum, item) => sum + item.subtotal, 0);
    const processCost = processes.reduce((sum, item) => sum + item.subtotal, 0);
    const packagingCost = packaging.reduce((sum, item) => sum + item.subtotal, 0);
    return materialCost + processCost + packagingCost + freight;
  }

  // 计算管销价
  calculateOverheadPrice(baseCost) {
    return baseCost / (1 - this.overheadRate);
  }

  // 计算内销价
  calculateDomesticPrice(overheadPrice) {
    return overheadPrice * (1 + this.vatRate);
  }

  // 计算外销价
  calculateExportPrice(overheadPrice) {
    return overheadPrice / this.exchangeRate;
  }

  // 计算保险价
  calculateInsurancePrice(exportPrice) {
    return exportPrice * (1 + this.insuranceRate);
  }

  // 生成利润区间报价
  generateProfitTiers(basePrice) {
    return this.profitTiers.map(tier => ({
      profit_rate: tier,
      price: basePrice * (1 + tier)
    }));
  }
}
```

### 2. Excel 解析器（ExcelParser）

```javascript
class ExcelParser {
  // 解析原料 Excel
  parseMaterialExcel(filePath) {
    // 读取 Excel 文件
    // 验证列：原料名、单位、单价、币别
    // 返回解析后的数据数组
  }

  // 解析工序 Excel
  parseProcessExcel(filePath) {
    // 读取 Excel 文件
    // 验证列：工序名称、单价、适用型号
    // 返回解析后的数据数组
  }

  // 验证数据格式
  validateData(data, schema) {
    // 验证必填字段
    // 验证数据类型
    // 返回验证结果
  }
}
```

### 3. Excel 模板生成器（ExcelTemplate）

```javascript
class ExcelTemplate {
  constructor(quotation) {
    this.quotation = quotation;
    this.workbook = new ExcelJS.Workbook();
  }

  // 生成报价单 Excel
  async generate() {
    const worksheet = this.workbook.addWorksheet('报价单');
    
    // 设置列宽
    this.setColumnWidths(worksheet);
    
    // 生成表头
    this.generateHeader(worksheet);
    
    // 生成原料区域
    this.generateMaterialSection(worksheet);
    
    // 生成工序区域
    this.generateProcessSection(worksheet);
    
    // 生成包材区域
    this.generatePackagingSection(worksheet);
    
    // 生成计算结果区域
    this.generateCalculationSection(worksheet);
    
    // 生成利润区间报价表
    this.generateProfitTiersSection(worksheet);
    
    // 应用样式
    this.applyStyles(worksheet);
    
    return this.workbook;
  }

  // 设置单元格样式
  applyCellStyle(cell, style) {
    // 字体、边框、背景色、对齐方式
  }
}
```

---

## 错误处理策略

### 1. 前端错误处理

```javascript
// Axios 响应拦截器
axios.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，跳转登录
          router.push('/login');
          break;
        case 403:
          // 无权限
          ElMessage.error('您没有权限执行此操作');
          break;
        case 404:
          // 资源不存在
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          // 服务器错误
          ElMessage.error('服务器错误，请稍后重试');
          break;
        default:
          ElMessage.error(error.response.data.message || '请求失败');
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);
```

### 2. 后端错误处理

```javascript
// 统一错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: '未授权访问'
    });
  }

  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
};
```

---

## 测试策略

### 1. 单元测试

- 成本计算逻辑测试
- 数据验证测试
- 工具函数测试

### 2. 集成测试

- API 接口测试
- 数据库操作测试
- 权限控制测试

### 3. 端到端测试

- 完整业务流程测试
- 用户交互测试

---

## 部署架构

### 生产环境部署

```
┌─────────────────────────────────────┐
│         Nginx 反向代理               │
│    (静态文件 + API 转发)              │
└──────────┬──────────────────────────┘
           │
           ├─→ 静态文件 (Vue 构建产物)
           │
           └─→ Express 服务器 (PM2 守护)
                    │
                    └─→ SQLite 数据库
```

### 部署步骤

1. 前端构建：`npm run build`
2. 后端启动：`pm2 start server.js`
3. Nginx 配置：反向代理 + 静态文件服务
4. 数据库备份：定时备份 SQLite 文件

---

## 安全考虑

### 1. 认证安全

- 密码使用 bcrypt 加密存储
- JWT Token 有效期设置
- Token 刷新机制

### 2. 权限控制

- 基于角色的访问控制（RBAC）
- API 接口权限验证
- 前端路由权限守卫

### 3. 数据安全

- SQL 注入防护（参数化查询）
- XSS 防护（输入验证 + 输出转义）
- CSRF 防护（Token 验证）

### 4. 文件上传安全

- 文件类型验证
- 文件大小限制
- 文件名安全处理

---

## 性能优化

### 1. 前端优化

- 路由懒加载
- 组件按需加载
- 图片懒加载
- 虚拟滚动（大数据表格）
- 请求防抖/节流

### 2. 后端优化

- 数据库索引优化
- 查询结果缓存
- 分页查询
- 并发控制

### 3. 数据库优化

- 为常用查询字段添加索引
- 定期清理历史数据
- 数据库文件压缩

---

## 维护与监控

### 1. 日志系统

- 访问日志
- 错误日志
- 操作日志（审计）

### 2. 备份策略

- 每日自动备份数据库
- 保留最近 30 天备份
- 异地备份

### 3. 监控指标

- 系统运行状态
- API 响应时间
- 错误率统计
- 用户活跃度

---

## 总结

本设计文档详细规划了成本分析管理系统的 11 个开发阶段，每个阶段都有明确的目标和交付物。整个开发过程严格遵循 README 中定义的项目文件结构，确保代码组织清晰、职责分明。

### 关键特性

1. **模块化设计**：前后端分离，各模块独立开发和测试
2. **标准化流程**：统一的数据导入导出格式
3. **自动化计算**：核心成本计算逻辑封装在后端
4. **权限控制**：基于角色的细粒度权限管理
5. **用户体验**：类 Excel 界面，降低学习成本
6. **可维护性**：清晰的代码结构和完善的文档

### 开发周期

总计 16 周（约 4 个月），包含：
- 基础设施搭建（2 周）
- 核心功能开发（9 周）
- 辅助功能开发（3 周）
- 测试优化部署（2 周）

### 技术保障

- 使用成熟稳定的技术栈
- 完善的错误处理机制
- 全面的测试覆盖
- 安全的权限控制
- 高效的性能优化
