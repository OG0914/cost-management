# 问题4修正：SQL 查询构建器

## 修正日期
2025-11-26

## 问题描述
在 `backend/models/Quotation.js` 的 `findAll` 方法中，使用了手动拼接 SQL 字符串的方式构建动态查询：

```javascript
let whereClause = [];
let params = [];

if (status) {
  whereClause.push('q.status = ?');
  params.push(status);
}
// ... 更多条件拼接

const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';
```

### 存在的风险
1. **可读性差**：复杂查询时，SQL 字符串拼接难以维护
2. **容易出错**：如果某个条件忘记用 `?` 而直接拼接变量，就会产生 SQL 注入风险
3. **代码重复**：每个需要动态查询的地方都要重复类似的拼接逻辑

## 解决方案

### 1. 创建查询构建器 `backend/utils/queryBuilder.js`

实现了一个轻量级的 SQL 查询构建器，提供以下功能：

- **链式调用**：支持流畅的 API 设计
- **参数化查询**：所有值都使用 `?` 占位符，防止 SQL 注入
- **常用操作**：WHERE、LIKE、IN、JOIN、ORDER BY、LIMIT、OFFSET
- **参数隔离**：`buildSelect` 使用局部变量组合参数，不修改 `this.params`

#### 核心方法

```javascript
class QueryBuilder {
  where(field, operator, value)      // WHERE 条件
  whereLike(field, value)            // LIKE 模糊查询
  whereIn(field, values)             // IN 查询
  whereDate(field, operator, date)   // 日期条件
  leftJoin(table, condition)         // LEFT JOIN
  orderByDesc(field)                 // 降序排序
  orderByAsc(field)                  // 升序排序
  limit(value)                       // LIMIT
  offset(value)                      // OFFSET
  buildSelect(fields)                // 构建 SELECT 查询
  buildCount()                       // 构建 COUNT 查询
  clone()                            // 克隆查询构建器
}
```

### 2. 重构 `Quotation.findAll` 方法

**重构前**（手动拼接）：
```javascript
let whereClause = [];
let params = [];

if (status) {
  whereClause.push('q.status = ?');
  params.push(status);
}

if (customer_name) {
  whereClause.push('q.customer_name LIKE ?');
  params.push(`%${customer_name}%`);
}

const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';
const countStmt = db.prepare(`SELECT COUNT(*) as total FROM quotations q ${whereSQL}`);
```

**重构后**（使用查询构建器）：
```javascript
const builder = new QueryBuilder('quotations q')
  .leftJoin('regulations r', 'q.regulation_id = r.id')
  .leftJoin('models m', 'q.model_id = m.id')
  .leftJoin('packaging_configs pc', 'q.packaging_config_id = pc.id')
  .leftJoin('users u1', 'q.created_by = u1.id')
  .leftJoin('users u2', 'q.reviewed_by = u2.id');

if (status) builder.where('q.status', '=', status);
if (customer_name) builder.whereLike('q.customer_name', customer_name);
if (model_id) builder.where('q.model_id', '=', model_id);
if (created_by) builder.where('q.created_by', '=', created_by);
if (date_from) builder.whereDate('q.created_at', '>=', date_from);
if (date_to) builder.whereDate('q.created_at', '<=', date_to);

// 查询总数
const countQuery = builder.buildCount();
const { total } = db.prepare(countQuery.sql).get(...countQuery.params);

// 查询数据
const dataQuery = builder
  .orderByDesc('q.created_at')
  .limit(pageSize)
  .offset(offset)
  .buildSelect('q.*, r.name as regulation_name, ...');

const data = db.prepare(dataQuery.sql).all(...dataQuery.params);
```

## 改进效果

### 1. 可读性提升
- 代码结构清晰，一目了然
- 链式调用符合直觉
- 条件添加更加语义化

### 2. 安全性增强
- 所有参数都通过占位符传递
- 避免了手动拼接字符串的风险
- 统一的参数处理逻辑

### 3. 可维护性提高
- 查询逻辑集中在 QueryBuilder 中
- 修改查询构建逻辑只需修改一处
- 易于扩展新的查询方法

### 4. 参数隔离
- `buildSelect` 使用局部变量 `queryParams`
- 不会修改 `this.params`
- 支持多次调用 `buildSelect` 而不影响原始参数

## 测试验证

### 单元测试
创建了 `backend/utils/queryBuilder.test.js`，测试了以下场景：
- ✅ 基本 SELECT 查询
- ✅ 带 JOIN 的查询
- ✅ 多条件查询
- ✅ 分页查询
- ✅ COUNT 查询
- ✅ 参数隔离（验证 buildSelect 不修改 this.params）
- ✅ WHERE IN 查询
- ✅ 克隆查询构建器

### 集成测试
创建了 `backend/test-query-simple.js`，在真实数据库环境中测试：
- ✅ 查询报价单列表
- ✅ 带条件的查询
- ✅ COUNT 查询
- ✅ 多次调用验证

所有测试均通过 ✅

## 使用示例

### 示例 1：简单查询
```javascript
const builder = new QueryBuilder('users')
  .where('role', '=', 'admin')
  .orderByDesc('created_at')
  .limit(10);

const query = builder.buildSelect();
const users = db.prepare(query.sql).all(...query.params);
```

### 示例 2：复杂查询
```javascript
const builder = new QueryBuilder('quotations q')
  .leftJoin('models m', 'q.model_id = m.id')
  .leftJoin('users u', 'q.created_by = u.id')
  .where('q.status', '=', 'submitted')
  .whereLike('q.customer_name', '测试')
  .whereDate('q.created_at', '>=', '2025-01-01')
  .orderByDesc('q.created_at')
  .limit(20)
  .offset(0);

const query = builder.buildSelect('q.*, m.model_name, u.real_name');
const quotations = db.prepare(query.sql).all(...query.params);
```

### 示例 3：COUNT 查询
```javascript
const builder = new QueryBuilder('quotations')
  .where('status', '=', 'draft')
  .whereIn('model_id', [1, 2, 3]);

const countQuery = builder.buildCount();
const { total } = db.prepare(countQuery.sql).get(...countQuery.params);
```

## 后续建议

### 1. 扩展其他模型
虽然目前只有 `Quotation.findAll` 使用了手动拼接，但建议在未来新增复杂查询时都使用 QueryBuilder。

### 2. 可选：引入 Knex.js
如果项目规模继续扩大，可以考虑引入 Knex.js 这样的成熟查询构建器：
```bash
npm install knex
```

优点：
- 功能更强大（支持事务、迁移、种子数据等）
- 社区支持好
- 文档完善

缺点：
- 增加依赖
- 学习成本

### 3. 添加更多查询方法
根据实际需求，可以扩展 QueryBuilder：
- `whereNull(field)` - NULL 判断
- `whereBetween(field, min, max)` - 范围查询
- `groupBy(field)` - 分组
- `having(condition)` - HAVING 子句
- `innerJoin(table, condition)` - INNER JOIN

## 文件清单

### 新增文件
- `backend/utils/queryBuilder.js` - 查询构建器核心代码
- `backend/utils/queryBuilder.test.js` - 单元测试
- `backend/test-query-simple.js` - 集成测试
- `backend/test-quotation-query.js` - Quotation 模型测试

### 修改文件
- `backend/models/Quotation.js` - 重构 findAll 方法

## 总结

通过引入轻量级的 QueryBuilder，成功解决了 SQL 手动拼接的潜在隐患，提升了代码的可读性、安全性和可维护性。这是一个低成本、高收益的重构，为后续的开发奠定了良好的基础。

**关键改进点**：
1. ✅ 消除了 SQL 注入风险
2. ✅ 提高了代码可读性
3. ✅ 统一了查询构建逻辑
4. ✅ 支持链式调用
5. ✅ 参数隔离，避免副作用
6. ✅ 易于测试和维护
