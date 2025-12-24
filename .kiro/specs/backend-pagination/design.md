# Design Document: Backend Pagination

## Overview

本设计文档描述后端分页优化的技术实现方案。核心目标是将当前的前端分页模式改造为后端分页模式，提升系统在大数据量场景下的性能和用户体验。

### 设计原则

1. **最小改动原则**：复用现有的 `QueryBuilder` 和 `paginated` 响应格式
2. **向后兼容**：保持 API 路径不变，仅调整参数和响应
3. **统一规范**：所有列表接口采用相同的分页参数和响应格式

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Material    │    │ CostRecords │    │ Review      │     │
│  │ Manage.vue  │    │ .vue        │    │ .vue        │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  usePagination  │  (可选：组合式函数)    │
│                   │  + debounce     │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP Request
                             │ ?page=1&pageSize=20&keyword=xxx
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Controllers                        │   │
│  │  materialController / costController / reviewController│   │
│  └──────────────────────────┬──────────────────────────┘   │
│                             │                               │
│                   ┌─────────▼─────────┐                     │
│                   │   QueryBuilder    │                     │
│                   │ + whereLikeOr()   │                     │
│                   └─────────┬─────────┘                     │
│                             │                               │
│                   ┌─────────▼─────────┐                     │
│                   │    PostgreSQL     │                     │
│                   │  LIMIT + OFFSET   │                     │
│                   └───────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 统一分页请求参数

```typescript
interface PaginationParams {
  page?: number;        // 当前页码，默认 1
  pageSize?: number;    // 每页条数，默认 20
  keyword?: string;     // 搜索关键词
  sortField?: string;   // 排序字段
  sortOrder?: 'asc' | 'desc';  // 排序方向，默认 desc
}
```

### 2. 统一分页响应格式

```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;      // 符合条件的总记录数
  page: number;       // 当前页码
  pageSize: number;   // 每页条数
}
```

### 3. QueryBuilder 增强接口

```javascript
class QueryBuilder {
  /**
   * 添加多字段 OR 模糊匹配条件
   * @param {string[]} fields - 字段名数组
   * @param {string} value - 搜索值
   * @returns {QueryBuilder}
   */
  whereLikeOr(fields, value) {
    if (!value || !value.trim()) return this;
    
    const conditions = fields.map(field => {
      return `${field} ILIKE $${this._nextPlaceholder()}`;
    });
    
    this.conditions.push(`(${conditions.join(' OR ')})`);
    fields.forEach(() => this.params.push(`%${value}%`));
    
    return this;
  }
}
```

### 4. 前端分页组合式函数（可选）

```javascript
// composables/usePagination.js
export function usePagination(fetchFn, options = {}) {
  const loading = ref(false)
  const data = ref([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(options.defaultPageSize || 20)
  const keyword = ref('')

  const totalPages = computed(() => 
    Math.ceil(total.value / pageSize.value) || 1
  )

  const loadData = async () => {
    loading.value = true
    try {
      const res = await fetchFn({
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined
      })
      if (res.success) {
        data.value = res.data
        total.value = res.total
      }
    } finally {
      loading.value = false
    }
  }

  const handleSearch = useDebounceFn(() => {
    currentPage.value = 1
    loadData()
  }, 300)

  return {
    loading, data, total, currentPage, pageSize, 
    keyword, totalPages, loadData, handleSearch
  }
}
```

## Data Models

### 现有数据模型（无需修改）

数据库表结构保持不变，分页通过 SQL 的 `LIMIT` 和 `OFFSET` 实现。

### 查询示例

```sql
-- 原料搜索分页查询
SELECT * FROM materials 
WHERE (item_no ILIKE $1 OR name ILIKE $2)
ORDER BY updated_at DESC
LIMIT $3 OFFSET $4;

-- 对应的 COUNT 查询
SELECT COUNT(*) as total FROM materials 
WHERE (item_no ILIKE $1 OR name ILIKE $2);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 分页响应格式一致性

*For any* 分页请求，响应必须包含 data（数组）、total（非负整数）、page（正整数）、pageSize（正整数）四个字段，且 data.length <= pageSize。

**Validates: Requirements 1.4, 1.5**

### Property 2: 分页数据正确性

*For any* 分页请求，返回的 data 数组长度应满足：当 total > 0 时，data.length = min(pageSize, total - (page - 1) * pageSize)；当 total = 0 时，data.length = 0。

**Validates: Requirements 1.5, 2.5**

### Property 3: 搜索结果匹配性

*For any* 带有 keyword 参数的搜索请求，返回的每条记录必须至少有一个搜索字段包含该关键词（不区分大小写）。

**Validates: Requirements 2.2, 3.2, 4.3**

### Property 4: 排序正确性

*For any* 分页查询结果，数据应按指定字段（默认为时间字段）降序排列，即 data[i].sortField >= data[i+1].sortField。

**Validates: Requirements 3.4, 4.4**

### Property 5: 状态过滤正确性

*For any* 待审核列表查询，返回的每条记录 status 必须为 'submitted'；*For any* 已审核列表查询，返回的每条记录 status 必须为 'approved' 或 'rejected'。

**Validates: Requirements 4.1, 4.2**

### Property 6: QueryBuilder SQL 生成正确性

*For any* 调用 whereLikeOr(fields, value) 后生成的 SQL，应包含 `(field1 ILIKE $n OR field2 ILIKE $m ...)` 格式的条件，且占位符索引连续递增。

**Validates: Requirements 6.2, 6.3**

## Error Handling

### 参数校验

| 参数 | 校验规则 | 错误处理 |
|------|---------|---------|
| page | 必须为正整数 | 无效时使用默认值 1 |
| pageSize | 必须为 1-100 之间的整数 | 无效时使用默认值 20，超过 100 时限制为 100 |
| keyword | 字符串，可选 | 空字符串视为无搜索条件 |
| sortField | 必须为允许的字段名 | 无效时使用默认排序字段 |
| sortOrder | 必须为 'asc' 或 'desc' | 无效时使用默认值 'desc' |

### 数据库错误

- 查询超时：返回 500 错误，提示用户稍后重试
- 连接失败：返回 503 错误，提示服务暂时不可用

## Testing Strategy

### 单元测试

1. **QueryBuilder.whereLikeOr 测试**
   - 测试单字段搜索
   - 测试多字段搜索
   - 测试空值跳过
   - 测试占位符索引正确性

2. **分页参数解析测试**
   - 测试默认值应用
   - 测试边界值处理
   - 测试无效参数处理

### 属性测试

使用 fast-check 进行属性测试，每个属性测试运行至少 100 次迭代。

1. **Property 1 测试**：生成随机分页参数，验证响应格式
2. **Property 2 测试**：生成随机数据集和分页参数，验证返回数量
3. **Property 3 测试**：生成随机关键词，验证搜索结果匹配
4. **Property 6 测试**：生成随机字段和值，验证 SQL 生成

### 集成测试

1. 端到端分页流程测试
2. 搜索 + 分页组合测试
3. 并发请求测试

### 测试框架

- 后端：Jest + fast-check
- 前端：Vitest + @vue/test-utils
