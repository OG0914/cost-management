# 成本报价 API 文档

## 基础信息

- 基础路径: `/api/cost`
- 所有接口都需要认证（Bearer Token）
- 响应格式: JSON

## 接口列表

### 1. 创建报价单

**接口**: `POST /api/cost/quotations`

**权限**: 业务员、管理员

**请求体**:
```json
{
  "customer_name": "测试客户",
  "customer_region": "华东",
  "model_id": 1,
  "regulation_id": 1,
  "quantity": 1000,
  "freight_total": 500,
  "sales_type": "domestic",
  "items": [
    {
      "category": "material",
      "item_name": "原料A",
      "usage_amount": 10,
      "unit_price": 100,
      "subtotal": 1000,
      "is_changed": 0
    },
    {
      "category": "process",
      "item_name": "工序A",
      "usage_amount": 5,
      "unit_price": 200,
      "subtotal": 1000,
      "is_changed": 0
    },
    {
      "category": "packaging",
      "item_name": "包材A",
      "usage_amount": 100,
      "unit_price": 2,
      "subtotal": 200,
      "is_changed": 0
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "message": "报价单创建成功",
  "data": {
    "quotation": {
      "id": 1,
      "quotation_no": "QT20251024123456",
      "customer_name": "测试客户",
      "status": "draft",
      ...
    },
    "calculation": {
      "baseCost": 2200.5,
      "overheadPrice": 2750.625,
      "domesticPrice": 3108.20625,
      "profitTiers": [
        { "profitRate": 0.05, "profitPercentage": "5%", "price": 3263.6166 },
        { "profitRate": 0.10, "profitPercentage": "10%", "price": 3419.0269 },
        { "profitRate": 0.25, "profitPercentage": "25%", "price": 3885.2578 },
        { "profitRate": 0.50, "profitPercentage": "50%", "price": 4662.3094 }
      ],
      "currency": "CNY"
    }
  }
}
```

---

### 2. 获取型号标准数据

**接口**: `GET /api/cost/models/:modelId/standard-data`

**权限**: 所有登录用户

**路径参数**:
- `modelId`: 型号ID

**响应**:
```json
{
  "success": true,
  "message": "获取型号标准数据成功",
  "data": {
    "materials": [
      {
        "id": 1,
        "name": "原料A",
        "unit": "kg",
        "price": 100,
        "currency": "CNY",
        "usage_amount": 10
      }
    ],
    "processes": [
      {
        "id": 1,
        "name": "工序A",
        "price": 200
      }
    ],
    "packaging": [
      {
        "id": 1,
        "name": "包材A",
        "usage_amount": 100,
        "price": 2,
        "currency": "CNY"
      }
    ]
  }
}
```

---

### 3. 计算报价（不保存）

**接口**: `POST /api/cost/calculate`

**权限**: 所有登录用户

**请求体**:
```json
{
  "quantity": 1000,
  "freight_total": 500,
  "sales_type": "domestic",
  "items": [
    {
      "category": "material",
      "subtotal": 1000
    },
    {
      "category": "process",
      "subtotal": 1000
    },
    {
      "category": "packaging",
      "subtotal": 200
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "message": "计算成功",
  "data": {
    "baseCost": 2200.5,
    "overheadPrice": 2750.625,
    "freightCost": 0.5,
    "salesType": "domestic",
    "domesticPrice": 3108.20625,
    "profitTiers": [...],
    "currency": "CNY"
  }
}
```

---

### 4. 更新报价单

**接口**: `PUT /api/cost/quotations/:id`

**权限**: 创建者或管理员

**路径参数**:
- `id`: 报价单ID

**请求体**: 与创建报价单相同（不包含 model_id 和 regulation_id）

**响应**:
```json
{
  "success": true,
  "message": "报价单更新成功",
  "data": {
    "quotation": {...},
    "calculation": {...}
  }
}
```

---

### 5. 提交报价单

**接口**: `POST /api/cost/quotations/:id/submit`

**权限**: 创建者或管理员

**路径参数**:
- `id`: 报价单ID

**响应**:
```json
{
  "success": true,
  "message": "报价单提交成功",
  "data": {
    "id": 1,
    "status": "submitted",
    "submitted_at": "2025-10-24 12:34:56",
    ...
  }
}
```

---

### 6. 获取报价单列表

**接口**: `GET /api/cost/quotations`

**权限**: 所有登录用户（业务员只能看自己的）

**查询参数**:
- `status`: 状态筛选（draft/submitted/approved/rejected）
- `customer_name`: 客户名称（模糊搜索）
- `model_id`: 型号ID
- `date_from`: 开始日期（YYYY-MM-DD）
- `date_to`: 结束日期（YYYY-MM-DD）
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）

**示例**: `GET /api/cost/quotations?status=draft&page=1&pageSize=10`

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "quotation_no": "QT20251024123456",
      "customer_name": "测试客户",
      "status": "draft",
      "regulation_name": "NIOSH",
      "model_name": "N95",
      "creator_name": "张三",
      "created_at": "2025-10-24 12:34:56",
      ...
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

---

### 7. 获取报价单详情

**接口**: `GET /api/cost/quotations/:id`

**权限**: 创建者、管理员、审核人

**路径参数**:
- `id`: 报价单ID

**响应**:
```json
{
  "success": true,
  "message": "获取报价单详情成功",
  "data": {
    "quotation": {
      "id": 1,
      "quotation_no": "QT20251024123456",
      "customer_name": "测试客户",
      "status": "draft",
      ...
    },
    "items": {
      "material": {
        "total": 1000,
        "count": 2,
        "items": [...]
      },
      "process": {
        "total": 1000,
        "count": 1,
        "items": [...]
      },
      "packaging": {
        "total": 200,
        "count": 1,
        "items": [...]
      }
    },
    "calculation": {
      "baseCost": 2200.5,
      "overheadPrice": 2750.625,
      "profitTiers": [...],
      ...
    }
  }
}
```

---

### 8. 删除报价单

**接口**: `DELETE /api/cost/quotations/:id`

**权限**: 创建者或管理员

**路径参数**:
- `id`: 报价单ID

**响应**:
```json
{
  "success": true,
  "message": "报价单删除成功",
  "data": null
}
```

---

## 错误响应

所有接口在出错时返回统一格式：

```json
{
  "success": false,
  "message": "错误描述",
  "code": 400
}
```

常见错误码：
- `400`: 请求参数错误
- `401`: 未认证或认证失败
- `403`: 无权限
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 测试流程

### 1. 登录获取 Token
```bash
POST /api/auth/login
{
  "username": "salesperson",
  "password": "password123"
}
```

### 2. 获取型号标准数据
```bash
GET /api/cost/models/1/standard-data
Authorization: Bearer <token>
```

### 3. 创建报价单
```bash
POST /api/cost/quotations
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_name": "测试客户",
  "customer_region": "华东",
  "model_id": 1,
  "regulation_id": 1,
  "quantity": 1000,
  "freight_total": 500,
  "sales_type": "domestic",
  "items": [...]
}
```

### 4. 查看报价单列表
```bash
GET /api/cost/quotations?page=1&pageSize=10
Authorization: Bearer <token>
```

### 5. 提交报价单
```bash
POST /api/cost/quotations/1/submit
Authorization: Bearer <token>
```

---

## 注意事项

1. **权限控制**:
   - 业务员只能查看和操作自己创建的报价单
   - 管理员和审核人可以查看所有报价单
   - 只有草稿和已退回状态的报价单可以编辑
   - 只有草稿状态的报价单可以删除

2. **数据验证**:
   - 销售类型必须是 `domestic` 或 `export`
   - 数量必须大于 0
   - 必填字段不能为空

3. **计算逻辑**:
   - 系统自动从 system_config 表获取计算参数
   - 运费成本 = 运费总价 ÷ 数量
   - 成本价 = 原料总价 + 工价总价 + 包材总价 + 运费成本
   - 管销价 = 成本价 ÷ (1 - 管销率)
   - 内销价 = 管销价 × (1 + 增值税率)
   - 外销价 = 管销价 ÷ 汇率
   - 保险价 = 外销价 × (1 + 保险率)

4. **状态流转**:
   - draft（草稿）→ submitted（已提交）→ approved（已审核）
   - draft（草稿）→ submitted（已提交）→ rejected（已退回）→ submitted（重新提交）
