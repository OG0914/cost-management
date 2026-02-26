# 🧾 成本分析管理系统 README

## 一、项目简介

轻量级 Web 成本分析管理系统，用于取代人工审核的 Excel 成本表，实现自动计算、自动提醒、可视化报表导出。  
系统帮助审核人（K）高效复核口罩型号的原料、工价、包材及报价计算逻辑。

---

## 二、技术栈

| 层级   | 技术                                                    |
| ------ | ------------------------------------------------------- |
| 前端   | Vue3 + Element Plus + TailwindCSS + Axios + Pinia + Vue Router |
| 后端   | Node.js + Express + bcrypt + jsonwebtoken + multer      |
| 数据库 | PostgreSQL (pg 驱动 + 连接池)                           |
| 文件导出 | ExcelJS                                               |

---

## 三、系统目录结构

```bash
cost-analysis-system/
│
├── backend/                            # 后端服务
│   ├── server.js                       # Express 主入口
│   ├── db/                             # 数据库目录
│   │   ├── database.js                 # PostgreSQL 连接池管理
│   │   ├── schema.sql                  # PostgreSQL 表结构定义
│   │   └── migrations/                 # 数据库迁移脚本
│   ├── routes/                         # 路由模块
│   │   ├── authRoutes.js               # 登录与权限
│   │   ├── costRoutes.js               # 成本分析与报价逻辑
│   │   ├── materialRoutes.js           # 原料模块
│   │   ├── processRoutes.js            # 工序模块
│   │   ├── regulationRoutes.js         # 法规类别模块
│   │   ├── modelRoutes.js              # 型号模块
│   │   ├── configRoutes.js             # 系统配置模块
│   │   ├── standardCostRoutes.js       # 标准成本模块
│   │   ├── reviewRoutes.js             # 审核流程模块
│   │   ├── bomRoutes.js                # 产品BOM模块
│   │   └── dashboardRoutes.js          # 仪表盘模块
│   ├── controllers/                    # 控制器：业务逻辑处理层
│   │   ├── authController.js
│   │   ├── costController.js
│   │   ├── materialController.js
│   │   ├── processController.js
│   │   ├── regulationController.js
│   │   ├── modelController.js
│   │   ├── configController.js
│   │   ├── standardCostController.js
│   │   ├── reviewController.js         # 审核控制器
│   │   └── dashboardController.js       # 仪表盘控制器
│   ├── models/                         # 数据模型层
│   │   ├── User.js
│   │   ├── Regulation.js
│   │   ├── Model.js
│   │   ├── Material.js
│   │   ├── PackagingConfig.js
│   │   ├── PackagingMaterial.js
│   │   ├── ProcessConfig.js
│   │   ├── Quotation.js
│   │   ├── QuotationItem.js
│   │   ├── QuotationCustomFee.js
│   │   ├── StandardCost.js
│   │   ├── SystemConfig.js
│   │   ├── Comment.js                  # 批注模型
│   │   └── ModelBom.js                 # 产品BOM模型
│   ├── utils/                          # 工具函数与公式计算
│   │   ├── costCalculator.js           # 成本计算核心逻辑
│   │   ├── excelGenerator.js           # Excel 生成
│   │   ├── excelParser.js              # Excel 解析
│   │   ├── queryBuilder.js             # 查询构建器
│   │   └── response.js                 # 响应格式化
│   ├── middleware/                     # 权限验证与异常处理
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── roleCheck.js
│   ├── scripts/                        # 管理脚本
│   │   ├── createAdmin.js
│   │   ├── resetAdmin.js
│   │   └── resetAdminPg.js             # PostgreSQL管理员重置脚本
│   ├── uploads/                        # 文件上传目录
│   └── tests/                          # 测试目录
│
├── frontend/                           # 前端（Vue3 + Element Plus）
│   ├── src/
│   │   ├── main.js                     # Vue 入口文件
│   │   ├── App.vue                     # 根组件（含侧边导航）
│   │   ├── router/                     # 路由定义
│   │   │   └── index.js
│   │   ├── store/                      # Pinia 状态管理
│   │   │   ├── auth.js
│   │   │   ├── config.js
│   │   │   ├── quotation.js
│   │   │   └── review.js
│   │   ├── components/                 # 可复用组件
│   │   │   ├── common/                 # 通用组件
│   │   │   ├── dashboard/              # 仪表盘组件
│   │   │   ├── layout/                 # 布局组件
│   │   │   └── review/                 # 审核组件
│   │   ├── views/                      # 页面模块
│   │   │   ├── Login.vue               # 登录页
│   │   │   ├── Dashboard.vue           # 仪表盘
│   │   │   ├── Home.vue                # 首页
│   │   │   ├── config/                 # 系统配置模块
│   │   │   │   └── SystemConfig.vue
│   │   │   ├── process/                # 工序管理模块
│   │   │   │   └── ProcessManage.vue
│   │   │   ├── cost/                   # 成本管理模块
│   │   │   │   ├── CostAdd.vue         # 新增/编辑成本
│   │   │   │   ├── CostRecords.vue     # 成本记录
│   │   │   │   ├── CostDetail.vue      # 成本详情
│   │   │   │   ├── CostCompare.vue     # 成本比较
│   │   │   │   └── StandardCost.vue    # 标准成本管理
│   │   │   ├── material/               # 原料管理模块
│   │   │   │   └── MaterialManage.vue
│   │   │   ├── packaging/              # 包材管理模块
│   │   │   │   └── PackagingManage.vue
│   │   │   ├── regulation/             # 法规管理模块
│   │   │   │   └── RegulationManage.vue
│   │   │   ├── model/                  # 型号管理模块
│   │   │   │   └── ModelManage.vue
│   │   │   ├── user/                   # 用户管理模块
│   │   │   │   ├── UserManage.vue
│   │   │   │   └── ProfileSettings.vue
│   │   │   └── review/                 # 审核管理模块
│   │   │       ├── PendingReview.vue   # 待审核记录
│   │   │       └── ApprovedReview.vue  # 已审核记录
│   │   ├── config/                     # 配置文件
│   │   │   ├── categoryColors.js
│   │   │   ├── menuConfig.js
│   │   │   └── packagingTypes.js
│   │   ├── styles/                     # 全局样式
│   │   ├── utils/                      # 工具函数
│   │   └── images/                     # 图片资源
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .kiro/                              # 项目规范目录
│   ├── specs/                          # 功能规格文档
│   │   ├── backend-pagination/          # 后端分页
│   │   ├── card-view-toggle/           # 卡片视图切换
│   │   ├── quotation-review/            # 审核流程
│   │   ├── custom-fees-after-overhead/  # 自定义费用
│   │   ├── quotation-vat-rate-override/# 自定义税率
│   │   └── ...                         # 其他功能规格
│   └── settings/                       # 项目设置
│
├── docs/                               # 项目文档
│   ├── prd.md                          # 产品需求文档
│   ├── flowchart.md                    # 流程图
│   └── *.md                            # 其他文档
│
└── README.md
```

---

## 四、导航与功能模块设计

侧边导航栏采用 **层级折叠结构**，保持视觉简洁、功能清晰：

```
📊 仪表盘
├─ 成本管理
│   ├─ 新增成本
│   ├─ 标准成本
│   └─ 成本记录
├─ 审核管理
│   ├─ 待审核记录
│   └─ 已审核记录
├─ 法规管理
├─ 型号管理
├─ 原料管理
├─ 包材管理
├─ 工序管理
├─ 系统配置
└─ 用户管理
```

### 模块说明

| 模块                   | 功能描述                                                                 | 状态     |
| ---------------------- | ------------------------------------------------------------------------ | -------- |
| **仪表盘 Dashboard**   | 系统首页，快速导航入口                                                   | ✅ 已实现 |
| **成本管理 Cost**      | 核心模块：新增报价、成本记录查询、成本比较、标准成本管理                 | ✅ 已实现 |
| **法规管理 Regulation**| 管理法规类别（NIOSH、GB、CE等）                                          | ✅ 已实现 |
| **型号管理 Model**     | 管理产品型号，绑定法规类别，产品BOM管理                                  | ✅ 已实现 |
| **原料管理 Material**  | 管理原料明细（品名、用量、单价、币别），支持Excel导入                    | ✅ 已实现 |
| **包材管理 Packaging** | 管理包装配置及包材明细，支持卡片/列表视图切换                            | ✅ 已实现 |
| **工序管理 Process**   | 维护工序及单价配置，支持卡片/列表视图切换                               | ✅ 已实现 |
| **系统配置 Config**    | 管理管销率、税率、汇率、利润区间等系统参数                               | ✅ 已实现 |
| **用户管理 User**      | 管理六种账号类型及权限                                                   | ✅ 已实现 |
| **审核流程 Review**    | 审核人批注、差异高亮、状态流转、待审核/已审核页面                        | ✅ 已实现 |
| **报表导出 Report**    | 导出Excel格式报价单                                                      | 🚧 待开发 |
| **仪表盘统计图表**     | 报价次数、审核时长、成本趋势等可视化统计                                 | 🚧 待开发 |

---

## 五、系统主要流程

```text
[登录与权限验证]
        ↓
[选择法规类别与型号]
        ↓
[选择包装配置]
        ↓
[系统自动带出标准原料 + 工序 + 包材]
        ↓
[业务填写客户名、地区、数量、运费]
        ↓
[自动计算：成本价 → 管销价 → 利润价]
        ↓
[保存报价单]
        ↓
[导出报价单（Excel）]
```

---

## 六、项目启动

### 1. 安装 PostgreSQL

系统需要 PostgreSQL 数据库。请先安装并启动 PostgreSQL 服务：

- **Windows**: 下载安装包 https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt install postgresql`

### 2. 创建数据库

```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE cost_analysis;
```

### 3. 配置环境变量

在 `backend/.env` 文件中配置数据库连接：

```env
# 数据库配置（二选一）
# 方式1：连接字符串
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/cost_analysis

# 方式2：独立配置
PGHOST=localhost
PGPORT=5432
PGDATABASE=cost_analysis
PGUSER=postgres
PGPASSWORD=your_password

# 连接池配置（可选）
PG_POOL_MIN=2
PG_POOL_MAX=20
```

### 4. 启动服务

```bash
# 启动后端服务
cd backend
npm install
npm run dev    # 开发模式（nodemon）
# 或
npm start      # 生产模式

# 启动前端项目
cd frontend
npm install
npm run dev
```

访问前端：[http://localhost:5173](http://localhost:5173/)  
后端接口：[http://localhost:3000](http://localhost:3000/)  
健康检查：[http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 七、开发原则摘要

- 模块清晰、职责单一（每个文件仅处理一类逻辑）
- 导入与导出流程标准化（支持Excel导入、导出）
- 使用 PostgreSQL 数据库，支持生产环境并发访问
- 异步数据库操作，使用连接池提高性能
- 成本计算公式全在后端封装（防止前端公式被误删）
- 页面布局以侧边导航为主，卡片式操作直观简洁
- 后端分页优化，支持全量数据的高效查询和搜索
- 灵活的权限控制，支持6种角色和细粒度权限管理

---

## 八、已实现高级功能

### 8.1 审核流程 ✅
- **状态流转**：草稿 → 已提交 → 已审核/已退回 → 可重新提交
- **差异高亮**：业务员修改的明细项自动标记颜色
- **批注功能**：审核人和业务员均可添加批注
- **审核历史**：完整的时间线追溯
- **权限控制**：管理员/审核人/业务员可访问，其他读用户受限

### 8.2 后端分页 ✅
- **高效查询**：避免一次性加载全量数据
- **搜索功能**：支持多字段模糊搜索
- **防抖优化**：300ms防抖减少无效请求
- **排序支持**：按时间、状态等字段排序

### 8.3 卡片/列表视图切换 ✅
- **包材管理**：卡片视图展示包装配置详情
- **工序管理**：卡片视图展示工序配置详情
- **响应式布局**：自动适应不同屏幕尺寸

### 8.4 自定义费用 ✅
- **管销后累乘**：支持关税、服务费等额外费用
- **灵活配置**：可添加、删除费用项
- **自动计算**：实时更新总结金额

### 8.5 自定义增值税率 ✅
- **报价单级别**：单个报价单可覆盖全局税率
- **税率验证**：支持0-1之间的税率值
- **复制继承**：复制报价单时继承税率配置

### 8.6 产品BOM ✅
- **型号级别**：每个型号可配置标准原料清单
- **用量管理**：记录标准用量
- **排序支持**：自定义显示顺序

## 九、数据备份与恢复

系统提供完整的数据库备份、恢复方案，适配 Windows 10 + Docker Desktop 环境。详细文档见 [`docs/backup-plan.md`](docs/backup-plan.md)。

### 快速命令（PowerShell）

```powershell
# 手动备份
powershell -ExecutionPolicy Bypass -File "scripts\backup\backup.ps1"

# 注册每日自动备份（管理员权限运行，只需一次）
powershell -ExecutionPolicy Bypass -File "scripts\backup\setup-schedule.ps1"

# 从备份恢复
powershell -ExecutionPolicy Bypass -File "scripts\backup\restore.ps1" -BackupFile "G:\cost_backup\备份文件.dump"
```

### 脚本清单

| 脚本 | 功能 |
|------|------|
| `scripts/backup/backup.ps1` | 数据库自动备份，自动清理过期备份 |
| `scripts/backup/restore.ps1` | 从备份恢复数据，恢复前自动保存安全备份 |
| `scripts/backup/setup-schedule.ps1` | 一键注册 Windows 定时任务 |

---

## 十、待开发功能

- [ ] 报表导出页面（ReportExport.vue）
- [ ] PDF 导出支持
- [ ] 仪表盘统计图表（报价次数、审核时长、成本趋势）
