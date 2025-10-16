

# 🧾 成本分析管理系统 README

## 一、项目简介

轻量级 Web 成本分析管理系统，用于取代人工审核的 Excel 成本表，实现自动计算、自动提醒、可视化报表导出。  
系统帮助审核人（K）高效复核口罩型号的原料、工价、包材及报价计算逻辑。

---

## 二、技术栈

| 层级   | 技术                                        |
| ---- | ----------------------------------------- |
| 前端   | Vue3 + Element Plus + TailwindCSS + Axios |
| 后端   | Node.js + Express                         |
| 数据库  | better-sqlite3                            |
| 文件导出 | XLSX / ExcelJS                            |

---

## 三、系统目录结构

```bash
cost-analysis-system/
│
├── backend/                            # 后端服务
│   ├── server.js                       # Express 主入口
│   ├── db/                             # 数据库目录
│   │   ├── database.js                 # better-sqlite3 初始化
│   │   └── seedData.sql                # 初始建表脚本
│   ├── routes/                         # 路由模块
│   │   ├── authRoutes.js               # 登录与权限
│   │   ├── costRoutes.js               # 成本分析与报价逻辑
│   │   ├── materialRoutes.js           # 原料模块
│   │   ├── processRoutes.js            # 工序模块
│   │   ├── packagingRoutes.js          # 包材模块
│   │   ├── reportRoutes.js             # 报表导出模块
│   │   └── dashboardRoutes.js          # 仪表盘统计模块
│   ├── controllers/                    # 控制器：业务逻辑处理层
│   ├── models/                         # 数据模型层
│   ├── utils/                          # 工具函数与公式计算
│   └── middleware/                     # 权限验证与异常处理
│
├── frontend/                           # 前端（Vue3 + Element Plus）
│   ├── src/
│   │   ├── main.js                     # Vue 入口文件
│   │   ├── router/                     # 路由定义
│   │   │   └── index.js
│   │   ├── store/                      # Pinia 状态管理
│   │   ├── layouts/                    # 通用布局
│   │   │   └── Sidebar.vue             # 侧边导航栏组件
│   │   ├── components/                 # 可复用组件（表格、对话框等）
│   │   ├── views/                      # 页面模块（核心功能）
│   │   │   ├── Dashboard.vue           # 仪表盘（总览卡片）
│   │   │   ├── cost/                   # 成本管理模块
│   │   │   │   ├── CostAdd.vue         # 新增成本
│   │   │   │   └── CostRecords.vue     # 成本记录与比价
│   │   │   ├── material/               # 原料管理模块
│   │   │   │   └── MaterialManage.vue
│   │   │   ├── packaging/              # 包材管理模块
│   │   │   │   └── PackagingManage.vue
│   │   │   ├── process/                # 工序管理模块
│   │   │   │   └── ProcessManage.vue
│   │   │   ├── report/                 # 报表导出模块
│   │   │   │   └── ReportExport.vue
│   │   │   └── user/                   # 用户管理模块
│   │   │       └── UserManage.vue
│   │   └── styles/                     # 全局样式
│   ├── public/                         # 静态资源
│   │   └── index.html
│   └── package.json
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
　│   └─ 成本记录
　├─ 原料管理
　├─ 包材管理
　├─ 工序管理
　├─ 报表导出
　└─ 用户管理
```

### 模块说明

| 模块                 | 功能描述                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| **仪表盘 Dashboard**  | 显示关键指标：报价次数、平均审核时长、各型号成本趋势；以卡片式图表呈现。                                                                           |
| **成本管理 Cost**      | 系统核心模块。① **新增成本**：选择法规类别 → 型号 → 自动带入标准原料、工价、包材 → 输入客户信息与运费 → 自动计算成本价/管销价/利润价。② **成本记录**：查询历史成本分析、导出报价单、查看变更记录。 |
| **原料管理 Material**  | 管理与导入原料明细（品名、用量、单价、币别），由采购人员维护。支持Excel批量导入。                                                                    |
| **包材管理 Packaging** | 管理各包装方式（如10pcs/袋）对应的包材与用量，支持导入与编辑。                                                                             |
| **工序管理 Process**   | 维护不同型号对应的工序及单价（如超音波、封边、组装等），由生产人员维护。                                                                           |
| **报表导出 Report**    | 导出标准Excel格式报价单，完全复刻原Excel样式；支持利润分档（5%、10%、25%...）。                                                             |
| **用户管理 User**      | 管理六种账号类型（管理员、审核人、采购、生产、业务、只读）及其权限分配。                                                                           |

---

## 五、系统主要流程

```text
[登录与权限验证]
        ↓
[选择法规类别与型号]
        ↓
[系统自动带出标准原料 + 工序 + 包材]
        ↓
[业务填写客户名、地区、数量、运费]
        ↓
[自动计算：成本价 → 管销价(成本/0.8) → 利润价]
        ↓
[生成报价单（复刻Excel视觉样式）]
        ↓
[审核人批注与确认]
        ↓
[导出报价单（Excel / PDF）]
```

---

## 六、项目启动

```bash
# 启动后端服务
cd backend
npm install
npm start

# 启动前端项目
cd frontend
npm install
npm run dev
```

访问前端：[http://localhost:5173](http://localhost:5173/)  
后端接口：[http://localhost:3000](http://localhost:3000/)

---

## 七、开发原则摘要

- 模块清晰、职责单一（每个文件仅处理一类逻辑）

- 导入与导出流程标准化（支持Excel导入、导出）

- 数据库轻量嵌入，无需额外服务依赖

- 成本计算公式全在后端封装（防止前端公式被误删）

- 页面布局以侧边导航为主，卡片式操作直观简洁

- 报价结果完全复刻Excel表格式，用户无学习成本
