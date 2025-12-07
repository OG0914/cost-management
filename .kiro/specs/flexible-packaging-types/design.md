# Design Document

## Overview

本设计文档描述了灵活包装类型功能的技术实现方案。该功能将扩展现有的包装配置系统，支持多种预定义的包装类型（标准彩盒、无彩盒、泡壳直装、泡壳袋装），并提供配置驱动的扩展机制以便未来添加新的包装类型。

## Architecture

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Frontend (Vue.js)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  ProcessManage  │  │ PackagingManage │  │    CostAdd      │         │
│  │     .vue        │  │     .vue        │  │     .vue        │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                    │                   │
│  ┌────────▼────────────────────▼────────────────────▼────────┐         │
│  │              packagingTypeConfig.js (配置文件)             │         │
│  │  - 包装类型定义                                            │         │
│  │  - 格式化函数                                              │         │
│  │  - 计算函数                                                │         │
│  └───────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Backend (Node.js)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ processController│ │ configController │ │  costController │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                    │                   │
│  ┌────────▼────────────────────▼────────────────────▼────────┐         │
│  │                    PackagingConfig Model                   │         │
│  └───────────────────────────────────────────────────────────┘         │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────┐         │
│  │              packagingTypes.js (后端配置)                  │         │
│  └───────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL Database                           │
├─────────────────────────────────────────────────────────────────────────┤
│  packaging_configs                                                      │
│  ├── id                                                                 │
│  ├── model_id                                                           │
│  ├── config_name                                                        │
│  ├── packaging_type (NEW)                                               │
│  ├── layer1_qty (renamed from pc_per_bag)                              │
│  ├── layer2_qty (renamed from bags_per_box)                            │
│  ├── layer3_qty (renamed from boxes_per_carton, nullable)              │
│  └── ...                                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 包装类型配置文件 (Frontend)

**文件路径**: `frontend/src/config/packagingTypes.js`

```javascript
// 包装类型配置
export const PACKAGING_TYPES = {
  standard_box: {
    key: 'standard_box',
    name: '标准彩盒',
    layers: 3,
    labels: ['pc/袋', '袋/盒', '盒/箱'],
    fieldLabels: ['每袋数量（pcs）', '每盒袋数（bags）', '每箱盒数（boxes）']
  },
  no_box: {
    key: 'no_box',
    name: '无彩盒',
    layers: 2,
    labels: ['pc/袋', '袋/箱'],
    fieldLabels: ['每袋数量（pcs）', '每箱袋数（bags）']
  },
  blister_direct: {
    key: 'blister_direct',
    name: '泡壳直装',
    layers: 2,
    labels: ['pc/泡壳', '泡壳/箱'],
    fieldLabels: ['每泡壳数量（pcs）', '每箱泡壳数']
  },
  blister_bag: {
    key: 'blister_bag',
    name: '泡壳袋装',
    layers: 3,
    labels: ['pc/袋', '袋/泡壳', '泡壳/箱'],
    fieldLabels: ['每袋数量（pcs）', '每泡壳袋数（bags）', '每箱泡壳数']
  }
};

// 获取包装类型列表
export function getPackagingTypeList() {
  return Object.values(PACKAGING_TYPES);
}

// 格式化包装方式显示
export function formatPackagingMethod(type, layer1, layer2, layer3) {
  const config = PACKAGING_TYPES[type];
  if (!config) return '';
  
  if (config.layers === 2) {
    return `${layer1}${config.labels[0]}, ${layer2}${config.labels[1]}`;
  } else {
    return `${layer1}${config.labels[0]}, ${layer2}${config.labels[1]}, ${layer3}${config.labels[2]}`;
  }
}

// 计算每箱总数
export function calculateTotalPerCarton(type, layer1, layer2, layer3) {
  const config = PACKAGING_TYPES[type];
  if (!config) return 0;
  
  if (config.layers === 2) {
    return (layer1 || 0) * (layer2 || 0);
  } else {
    return (layer1 || 0) * (layer2 || 0) * (layer3 || 0);
  }
}
```

### 2. 后端配置文件

**文件路径**: `backend/config/packagingTypes.js`

```javascript
// 包装类型配置（与前端保持同步）
const PACKAGING_TYPES = {
  standard_box: { key: 'standard_box', name: '标准彩盒', layers: 3 },
  no_box: { key: 'no_box', name: '无彩盒', layers: 2 },
  blister_direct: { key: 'blister_direct', name: '泡壳直装', layers: 2 },
  blister_bag: { key: 'blister_bag', name: '泡壳袋装', layers: 3 }
};

// 验证包装类型是否有效
function isValidPackagingType(type) {
  return type in PACKAGING_TYPES;
}

// 获取所有包装类型
function getAllPackagingTypes() {
  return Object.values(PACKAGING_TYPES);
}

module.exports = { PACKAGING_TYPES, isValidPackagingType, getAllPackagingTypes };
```

### 3. API 接口变更

#### 3.1 获取包装类型列表
```
GET /api/config/packaging-types
Response: {
  success: true,
  data: [
    { key: 'standard_box', name: '标准彩盒', layers: 3 },
    { key: 'no_box', name: '无彩盒', layers: 2 },
    ...
  ]
}
```

#### 3.2 创建包装配置（更新）
```
POST /api/processes/packaging-configs
Body: {
  model_id: 1,
  config_name: '深圳厂',
  packaging_type: 'blister_bag',  // NEW
  layer1_qty: 1,                   // renamed
  layer2_qty: 3,                   // renamed
  layer3_qty: 12,                  // renamed, nullable
  processes: [...]
}
```

#### 3.3 查询包装配置（更新）
```
GET /api/processes/packaging-configs?packaging_type=standard_box
Response: {
  success: true,
  data: [
    {
      id: 1,
      model_id: 1,
      config_name: '深圳厂',
      packaging_type: 'standard_box',  // NEW
      layer1_qty: 10,
      layer2_qty: 5,
      layer3_qty: 20,
      ...
    }
  ]
}
```

#### 3.4 按类型分组查询
```
GET /api/processes/packaging-configs/grouped?model_id=1
Response: {
  success: true,
  data: {
    standard_box: [
      { id: 1, config_name: '深圳厂', ... },
      { id: 2, config_name: '东莞厂', ... }
    ],
    blister_bag: [
      { id: 3, config_name: '深圳厂', ... }
    ]
  }
}
```

## Data Models

### 数据库表结构变更

```sql
-- 添加包装类型字段
ALTER TABLE packaging_configs 
ADD COLUMN packaging_type VARCHAR(20) NOT NULL DEFAULT 'standard_box';

-- 添加约束
ALTER TABLE packaging_configs 
ADD CONSTRAINT chk_packaging_type 
CHECK (packaging_type IN ('standard_box', 'no_box', 'blister_direct', 'blister_bag'));

-- 重命名字段（可选方案A：直接重命名）
ALTER TABLE packaging_configs RENAME COLUMN pc_per_bag TO layer1_qty;
ALTER TABLE packaging_configs RENAME COLUMN bags_per_box TO layer2_qty;
ALTER TABLE packaging_configs RENAME COLUMN boxes_per_carton TO layer3_qty;

-- 允许 layer3_qty 为空（2层包装类型不需要）
ALTER TABLE packaging_configs ALTER COLUMN layer3_qty DROP NOT NULL;

-- 添加索引
CREATE INDEX idx_packaging_configs_type ON packaging_configs(packaging_type);
```

### 兼容性方案（可选方案B：保留原字段）

如果需要保持向后兼容，可以保留原字段名，添加视图：

```sql
-- 保留原字段，添加新字段
ALTER TABLE packaging_configs 
ADD COLUMN packaging_type VARCHAR(20) NOT NULL DEFAULT 'standard_box';

-- 创建兼容视图
CREATE VIEW packaging_configs_v2 AS
SELECT 
  id, model_id, config_name, packaging_type,
  pc_per_bag AS layer1_qty,
  bags_per_box AS layer2_qty,
  boxes_per_carton AS layer3_qty,
  is_active, created_at, updated_at
FROM packaging_configs;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 包装类型有效性验证
*For any* 包装配置创建或更新请求，packaging_type 字段值必须是预定义类型之一（standard_box、no_box、blister_direct、blister_bag），否则请求应被拒绝
**Validates: Requirements 1.2, 8.5**

### Property 2: 动态表单字段数量一致性
*For any* 包装类型配置，前端渲染的输入字段数量应等于该类型配置的 layers 值
**Validates: Requirements 2.2, 9.4**

### Property 3: 每箱总数计算正确性
*For any* 包装配置的层级数量组合，计算的每箱总数应等于所有层级数量的乘积（2层类型为 layer1 × layer2，3层类型为 layer1 × layer2 × layer3）
**Validates: Requirements 2.7, 5.5**

### Property 4: 包装方式格式化一致性
*For any* 包装配置，格式化后的包装方式字符串应包含该类型配置中定义的所有单位标签，且数量值与配置一致
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 9.5**

### Property 5: 筛选结果类型一致性
*For any* 按包装类型筛选的查询，返回的所有配置记录的 packaging_type 字段值应与筛选条件完全匹配
**Validates: Requirements 2.9, 3.3, 8.3**

### Property 6: 分组结构完整性
*For any* 分组查询结果，每个分组的 key 应是有效的包装类型，且分组内的所有配置记录的 packaging_type 应与分组 key 一致
**Validates: Requirements 4.1, 8.4**

### Property 7: 配置结构完整性
*For any* 包装类型配置定义，必须包含 key、name、layers、labels 字段，且 labels 数组长度应等于 layers 值
**Validates: Requirements 9.2, 10.1, 10.2**

### Property 8: Excel 导入类型验证
*For any* Excel 导入数据行，如果 packaging_type 值不是预定义类型之一，该行应被标记为错误并跳过，不影响其他有效行的导入
**Validates: Requirements 6.2**

### Property 9: API 响应包含包装类型
*For any* 包装配置查询 API 响应，每条配置记录必须包含 packaging_type 字段且值为有效的包装类型
**Validates: Requirements 8.2**

### Property 10: 包材管理继承一致性
*For any* 包材管理页面显示的配置，其包装类型和包装方式应与工序管理中的原始配置完全一致
**Validates: Requirements 3.1**

## Error Handling

### 前端错误处理

1. **包装类型未选择**: 提交表单时验证，显示"请选择包装类型"提示
2. **层级数量为空**: 根据包装类型验证必填字段，显示"请填写完整的包装方式"提示
3. **API 请求失败**: 显示错误消息，保留用户输入

### 后端错误处理

1. **无效包装类型**: 返回 400 错误，消息"无效的包装类型: {type}"
2. **层级数量缺失**: 返回 400 错误，消息"缺少必填字段: layer{n}_qty"
3. **数据库约束违反**: 捕获约束错误，返回友好错误消息

### Excel 导入错误处理

1. **无效包装类型**: 记录错误行号和原因，继续处理其他行
2. **层级数量格式错误**: 记录错误，跳过该行
3. **汇总报告**: 返回成功数、失败数、错误详情列表

## Testing Strategy

### 单元测试

1. **配置工具函数测试**
   - `formatPackagingMethod()` 各类型格式化
   - `calculateTotalPerCarton()` 各类型计算
   - `isValidPackagingType()` 验证函数

2. **Model 层测试**
   - PackagingConfig.create() 包含 packaging_type
   - PackagingConfig.findByType() 筛选功能
   - PackagingConfig.findGroupedByType() 分组功能

### 属性测试 (Property-Based Testing)

使用 fast-check 库进行属性测试：

1. **Property 1 测试**: 生成随机字符串作为 packaging_type，验证只有预定义值被接受
2. **Property 3 测试**: 生成随机层级数量，验证计算结果正确
3. **Property 4 测试**: 生成随机配置，验证格式化输出包含所有标签
4. **Property 5 测试**: 生成随机筛选条件，验证结果一致性

### 集成测试

1. **API 端到端测试**
   - 创建各类型配置
   - 查询和筛选
   - 分组查询

2. **Excel 导入导出测试**
   - 导入有效数据
   - 导入包含无效类型的数据
   - 导出并重新导入验证
