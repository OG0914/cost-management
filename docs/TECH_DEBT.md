# 技术债务追踪文档

> 最后更新: 2026-01-07 14:15
> 维护人: 雪球团队

本文档用于追踪项目中的技术债务，按优先级分类，确保系统稳定上线并持续改进。

---

## 📊 债务概览

| 优先级 | 数量 | 状态 |
|--------|------|------|
| P0 - 阻塞上线 | 3 | ✅ 2项已修复，1项需运维配合 |
| P1 - 上线后一周内 | 4 | ✅ 全部已修复 |
| P2 - 上线后一月内 | 5 | 计划中 |
| P3 - 长期优化 | 3 | 未排期 |

---

## 🔴 P0 - 阻塞上线（必须立即修复）

### P0-001: JWT_SECRET 使用默认值
- **位置**: `backend/.env`
- **问题**: 使用默认密钥 `your-secret-key-change-this-in-production`，存在严重安全风险
- **影响**: 攻击者可伪造任意用户的 token
- **修复方案**: 生成 64 字符的随机密钥
- **状态**: ✅ 已修复 (2026-01-07)

### P0-002: 错误处理器未适配 PostgreSQL
- **位置**: `backend/middleware/errorHandler.js` 第 34 行
- **问题**: 检测 SQLite 错误码，但项目已迁移至 PostgreSQL
- **影响**: PostgreSQL 数据库错误无法被正确捕获，可能导致错误信息泄露
- **修复方案**: 添加 PostgreSQL 错误码检测
- **状态**: ✅ 已修复 (2026-01-07)

### P0-003: 数据库弱密码
- **位置**: `backend/.env`
- **问题**: 使用弱密码 `1998`
- **影响**: 数据库可能被暴力破解
- **修复方案**: 使用强密码（至少 16 字符，包含大小写、数字、特殊字符）
- **状态**: ⏳ 待修复（需运维配合）

---

## 🟠 P1 - 上线后一周内修复

### P1-001: CORS 配置过于宽松
- **位置**: `backend/server.js` 第 17 行
- **问题**: `app.use(cors())` 允许所有来源
- **影响**: 可能被跨站攻击利用
- **修复方案**: 配置白名单
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
```
- **状态**: ✅ 已修复 (2026-01-07)

### P1-002: 缺少请求限流
- **位置**: `backend/server.js`
- **问题**: 无 API 限流机制
- **影响**: 可能被 DDoS 攻击或暴力破解
- **修复方案**: 添加 express-rate-limit
```javascript
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每IP最多100次请求
}));
```
- **状态**: ✅ 已修复 (2026-01-07)

### P1-003: 前端请求超时过短
- **位置**: `frontend/src/utils/request.js` 第 13 行
- **问题**: `timeout: 10000`（10秒）对于大数据操作可能不足
- **影响**: 大批量导入/导出操作可能超时失败
- **修复方案**: 可配置化，不同接口使用不同超时
- **状态**: ✅ 已修复 (2026-01-07)

### P1-004: 生产环境日志配置
- **位置**: 后端多处 `console.log`/`console.error`
- **问题**: 使用 console 而非专业日志库
- **影响**: 生产环境日志管理困难，无法分级
- **修复方案**: 引入 winston 或 pino
- **状态**: ✅ 已修复 (2026-01-07)

---

## 🟡 P2 - 上线后一月内优化

### P2-001: 重复代码 - 成本计算逻辑
- **位置**: `backend/controllers/costController.js`
- **问题**: `createQuotation`、`updateQuotation`、`calculateQuotation` 中有大量重复代码
- **影响**: 维护困难，修改一处容易遗漏其他
- **修复方案**: 提取公共函数 `_calculateCostItems(items, materialCoefficient)`
- **状态**: 📋 待处理

### P2-002: 组件过大 - PackagingManage.vue
- **位置**: `frontend/src/views/packaging/PackagingManage.vue`（1428行）
- **问题**: 严重超出 200 行限制
- **影响**: 代码难以维护和测试
- **修复方案**: 拆分为子组件
  - `PackagingFilterBar.vue` - 筛选栏
  - `PackagingCardView.vue` - 卡片视图
  - `PackagingListView.vue` - 列表视图
  - `PackagingEditDialog.vue` - 编辑弹窗
  - `MaterialCopyDialog.vue` - 复制包材弹窗
- **状态**: 📋 待处理

### P2-003: 组件过大 - ProcessManage.vue
- **位置**: `frontend/src/views/process/ProcessManage.vue`
- **问题**: 类似 PackagingManage.vue 的问题
- **修复方案**: 同上拆分策略
- **状态**: 📋 待处理

### P2-004: 控制器过大 - costController.js
- **位置**: `backend/controllers/costController.js`（912行）
- **问题**: 单文件过大，函数过长
- **修复方案**: 
  - 拆分为 `quotationController.js` 和 `packagingController.js`
  - 提取公共计算逻辑到 `services/costService.js`
- **状态**: 📋 待处理

### P2-005: 数据库冗余字段
- **位置**: `backend/db/schema.sql` 表 `packaging_configs`
- **问题**: `layer1_qty/layer2_qty/layer3_qty` 与 `pc_per_bag/bags_per_box/boxes_per_carton` 冗余
- **影响**: 数据一致性风险
- **修复方案**: 迁移后移除旧字段
- **状态**: 📋 待处理

---

## 🔵 P3 - 长期优化

### P3-001: 引入 TypeScript
- **范围**: 全部前端代码
- **目的**: 提升类型安全，减少运行时错误
- **方案**: 
  1. 从 store 模块开始迁移
  2. 逐步迁移 utils
  3. 最后迁移组件
- **状态**: 📋 未排期

### P3-002: 统一样式方案
- **范围**: 全部前端组件
- **问题**: 混用 scoped CSS、Tailwind、内联样式
- **方案**: 统一使用 scoped CSS + CSS 变量
- **状态**: 📋 未排期

### P3-003: 添加单元测试
- **范围**: 核心业务逻辑
- **目的**: 确保代码质量，支持安全重构
- **方案**: 
  - 后端: Jest + Supertest
  - 前端: Vitest + Vue Test Utils
- **状态**: 📋 未排期

---

## 📝 修复记录

| 日期 | 编号 | 描述 | 修复人 |
|------|------|------|--------|
| 2026-01-07 | P0-001 | JWT_SECRET 更新为随机强密钥 | 雪球团队 |
| 2026-01-07 | P0-002 | 错误处理器适配 PostgreSQL | 雪球团队 |
| 2026-01-07 | P1-001 | CORS 配置白名单模式 | 雪球团队 |
| 2026-01-07 | P1-002 | 添加请求限流 (express-rate-limit) | 雪球团队 |
| 2026-01-07 | P1-003 | 前端请求超时优化（30s/120s） | 雪球团队 |
| 2026-01-07 | P1-004 | 集成 Winston 日志系统 | 雪球团队 |

---

## 📌 注意事项

1. **P0 问题必须在上线前全部解决**
2. **P1 问题建议在上线后第一周内完成**
3. **每次修复后需更新本文档状态**
4. **大型重构需先在测试环境验证**
