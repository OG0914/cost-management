/**
 * QueryBuilder 测试文件
 * 用于验证查询构建器的功能
 */

const QueryBuilder = require('./queryBuilder');

console.log('=== QueryBuilder 测试 ===\n');

// 测试 1: 基本 SELECT 查询
console.log('测试 1: 基本 SELECT 查询');
const query1 = new QueryBuilder('users')
  .where('id', '=', 1)
  .buildSelect();
console.log('SQL:', query1.sql);
console.log('Params:', query1.params);
console.log('预期: SELECT * FROM users WHERE id = ?');
console.log('参数: [1]\n');

// 测试 2: 带 JOIN 的查询
console.log('测试 2: 带 JOIN 的查询');
const query2 = new QueryBuilder('quotations q')
  .leftJoin('models m', 'q.model_id = m.id')
  .leftJoin('users u', 'q.created_by = u.id')
  .where('q.status', '=', 'draft')
  .buildSelect('q.*, m.model_name, u.real_name');
console.log('SQL:', query2.sql);
console.log('Params:', query2.params);
console.log('');

// 测试 3: 多条件查询
console.log('测试 3: 多条件查询');
const query3 = new QueryBuilder('quotations q')
  .where('q.status', '=', 'submitted')
  .whereLike('q.customer_name', '测试')
  .whereDate('q.created_at', '>=', '2025-01-01')
  .buildSelect();
console.log('SQL:', query3.sql);
console.log('Params:', query3.params);
console.log('');

// 测试 4: 分页查询
console.log('测试 4: 分页查询');
const query4 = new QueryBuilder('quotations q')
  .where('q.status', '=', 'approved')
  .orderByDesc('q.created_at')
  .limit(20)
  .offset(40)
  .buildSelect();
console.log('SQL:', query4.sql);
console.log('Params:', query4.params);
console.log('预期参数: ["approved", 20, 40]');
console.log('');

// 测试 5: COUNT 查询
console.log('测试 5: COUNT 查询');
const builder5 = new QueryBuilder('quotations q')
  .leftJoin('models m', 'q.model_id = m.id')
  .where('q.status', '=', 'draft')
  .whereLike('q.customer_name', '客户');

const countQuery = builder5.buildCount();
console.log('Count SQL:', countQuery.sql);
console.log('Count Params:', countQuery.params);
console.log('');

// 测试 6: 验证 buildSelect 不修改 this.params
console.log('测试 6: 验证 buildSelect 不修改 this.params');
const builder6 = new QueryBuilder('users')
  .where('role', '=', 'admin')
  .orderByDesc('created_at');

console.log('调用 buildSelect 前的 params:', builder6.params);
const selectQuery1 = builder6.limit(10).offset(0).buildSelect();
console.log('第一次 buildSelect 的 params:', selectQuery1.params);
console.log('调用后 builder.params:', builder6.params);

const selectQuery2 = builder6.limit(20).offset(20).buildSelect();
console.log('第二次 buildSelect 的 params:', selectQuery2.params);
console.log('调用后 builder.params:', builder6.params);
console.log('预期: builder.params 应该只包含 ["admin"]，不包含 limit/offset\n');

// 测试 7: WHERE IN 查询
console.log('测试 7: WHERE IN 查询');
const query7 = new QueryBuilder('quotations')
  .whereIn('status', ['draft', 'submitted', 'approved'])
  .buildSelect();
console.log('SQL:', query7.sql);
console.log('Params:', query7.params);
console.log('');

// 测试 8: 克隆查询构建器
console.log('测试 8: 克隆查询构建器');
const builder8 = new QueryBuilder('quotations q')
  .where('q.status', '=', 'draft')
  .whereLike('q.customer_name', '测试');

const cloned = builder8.clone();
cloned.where('q.model_id', '=', 5);

const originalQuery = builder8.buildSelect();
const clonedQuery = cloned.buildSelect();

console.log('原始查询 params:', originalQuery.params);
console.log('克隆查询 params:', clonedQuery.params);
console.log('预期: 原始查询应该只有 2 个参数，克隆查询应该有 3 个参数\n');

console.log('=== 测试完成 ===');
