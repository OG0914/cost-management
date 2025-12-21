# Design Document

## Overview

本设计文档描述了为包材管理（PackagingManage.vue）和工序管理（ProcessManage.vue）模块添加卡片/列表视图切换功能的技术方案。该功能参考现有用户管理模块（UserManage.vue）的实现模式，但根据包材和工序数据的特点进行定制化设计。

## Architecture

### 组件结构

```
PackagingManage.vue / ProcessManage.vue
├── Header Section (标题 + 操作按钮)
├── Filter Section (筛选栏 + 视图切换按钮)
├── Card View (卡片视图，v-if="viewMode === 'card'")
│   └── Config Card (单个配置卡片)
├── List View (列表视图，v-if="viewMode === 'list'")
│   └── el-table (现有表格)
└── Pagination (分页组件)
```

### 状态管理

```javascript
// 视图模式状态
const viewMode = ref('card')  // 'card' | 'list'

// 切换视图时清空选择
watch(viewMode, (newMode) => {
  if (newMode === 'card') {
    selectedConfigs.value = []
  }
})
```

## Components and Interfaces

### 1. 视图切换按钮组

位置：筛选栏同一行最右边

```vue
<div class="filter-section">
  <!-- 现有筛选控件 -->
  <el-select v-model="selectedModelId" ... />
  <el-select v-model="selectedPackagingType" ... />
  
  <!-- 视图切换按钮（最右边） -->
  <el-button-group class="view-toggle">
    <el-button
      :type="viewMode === 'card' ? 'primary' : 'default'"
      :icon="Grid"
      @click="viewMode = 'card'"
    />
    <el-button
      :type="viewMode === 'list' ? 'primary' : 'default'"
      :icon="List"
      @click="viewMode = 'list'"
    />
  </el-button-group>
</div>
```

### 2. 配置卡片组件

```vue
<div class="config-card">
  <!-- 卡片头部 -->
  <div class="card-header">
    <div class="header-info">
      <div class="model-name">{{ config.model_name }}</div>
      <div class="config-name">{{ config.config_name }}</div>
    </div>
    <div class="category-badge">
      {{ config.model_category }}
    </div>
  </div>
  
  <!-- 卡片内容 -->
  <div class="card-body">
    <el-tag :type="getPackagingTypeTagType(config.packaging_type)">
      {{ getPackagingTypeName(config.packaging_type) }}
    </el-tag>
    <div class="packaging-method">
      {{ formatPackagingMethodFromConfig(config) }}
    </div>
    <div class="total-qty">
      每箱: {{ calculateTotalFromConfig(config) }} pcs
    </div>
    <div class="price">
      💰 {{ priceLabel }}: ¥{{ formatNumber(config.price) }}
    </div>
    <div class="status">
      <span :class="config.is_active ? 'status-active' : 'status-inactive'"></span>
      {{ config.is_active ? '启用' : '禁用' }}
    </div>
  </div>
  
  <!-- 操作栏 -->
  <div class="card-actions">
    <el-button size="small" type="success" @click="viewDetails(config)">查看</el-button>
    <el-button size="small" type="primary" @click="editConfig(config)" v-if="canEdit">编辑</el-button>
    <el-button size="small" type="warning" @click="copyConfig(config)" v-if="canEdit">复制</el-button>
    <el-button size="small" type="danger" @click="deleteConfig(config)" v-if="canEdit">删除</el-button>
  </div>
</div>
```

## Data Models

### 卡片显示字段映射

| 卡片区域 | 显示内容 | 数据字段 |
|---------|---------|---------|
| 头部左上 | 产品型号 | `model_name` |
| 头部左下 | 配置名称 | `config_name` |
| 头部右侧圆形 | 产品类别 | `model_category` |
| 内容区 | 包装类型 | `packaging_type` |
| 内容区 | 包装方式 | `formatPackagingMethodFromConfig()` |
| 内容区 | 每箱数量 | `calculateTotalFromConfig()` |
| 内容区 | 价格 | `material_total_price` / `process_total_price` |
| 内容区 | 状态 | `is_active` |

### 产品类别颜色映射

```javascript
const CATEGORY_COLORS = {
  '半面罩': '#409EFF',
  '全面罩': '#67C23A',
  '滤盒': '#E6A23C',
  '滤棉': '#F56C6C',
  '配件': '#909399',
  // 默认颜色
  default: '#909399'
}

const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 筛选结果一致性

*For any* 筛选条件组合（型号、包装类型），卡片视图和列表视图显示的数据记录数量和内容应该完全一致

**Validates: Requirements 4.1, 4.2**

### Property 2: 分页数据完整性

*For any* 数据集，分页后所有页面的记录总数应等于筛选后的总记录数，且每条记录只出现一次

**Validates: Requirements 4.3**

### Property 3: 视图切换状态保持

*For any* 视图切换操作，筛选条件和分页状态应保持不变，仅展示方式改变

**Validates: Requirements 1.2, 1.3, 2.2, 2.3**

## Error Handling

1. **数据加载失败**: 显示错误提示，保持当前视图状态
2. **空数据状态**: 在卡片视图区域显示"暂无数据"提示
3. **图片/图标加载失败**: 使用默认占位符

## Testing Strategy

### 单元测试

- 测试 `viewMode` 状态切换逻辑
- 测试筛选功能在两种视图下的一致性
- 测试分页计算逻辑

### 属性测试

使用 Vitest 的 property-based testing 功能：

```javascript
import { fc } from '@fast-check/vitest'

// Property 1: 筛选结果一致性
test.prop([fc.array(fc.record({
  model_name: fc.string(),
  config_name: fc.string(),
  packaging_type: fc.constantFrom('standard_box', 'no_box', 'blister_direct'),
  is_active: fc.boolean()
}))])('筛选结果在两种视图下一致', (configs) => {
  // 测试实现
})
```

### 视觉测试

- 验证卡片布局在不同屏幕尺寸下的响应式表现
- 验证产品类别圆形标识的样式和位置

## UI Mockup

### 卡片布局详细设计

```
┌────────────────────────────────────┐
│                                    │
│  ┌─────────────────┐  ┌────────┐  │
│  │ MK8154          │  │        │  │
│  │ (产品型号,加粗)   │  │ 半面罩 │  │  ← 圆形，背景色区分类别
│  │                 │  │        │  │     高度 = 两行文字高度
│  │ C5标准包装       │  └────────┘  │
│  │ (配置名称,次级)   │              │
│  └─────────────────┘              │
│                                    │
│  📦 标准彩盒                        │  ← 包装类型标签
│                                    │
│  10pcs × 5袋 × 4盒                 │  ← 包装方式
│  每箱: 200 pcs                     │  ← 每箱数量
│                                    │
│  💰 包材总价: ¥12.50               │  ← 价格
│  🟢 启用                           │  ← 状态
│                                    │
│ ────────────────────────────────── │
│ [查看] [编辑] [复制] [删除]          │  ← 操作按钮
└────────────────────────────────────┘
```

### 页面整体布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 包材管理                          [下载模板][导入][导出][批量删除][新增包装配置] │
├─────────────────────────────────────────────────────────────────────────┤
│ [型号筛选 ▼]  [包装类型筛选 ▼]                              [🔲][📋]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │ MK8154    ┌─────┐  │  │ MK8154    ┌─────┐  │  │ MK9266    ┌─────┐  │ │
│  │ C5标准包装 │半面罩│  │  │ C5简装    │半面罩│  │  │ C6标准包装 │全面罩│  │ │
│  │           └─────┘  │  │           └─────┘  │  │           └─────┘  │ │
│  │ 📦 标准彩盒         │  │ 📦 无彩盒          │  │ 📦 标准彩盒         │ │
│  │ 10pcs×5袋×4盒      │  │ 20pcs×10袋        │  │ 8pcs×6袋×5盒       │ │
│  │ 每箱: 200 pcs      │  │ 每箱: 200 pcs      │  │ 每箱: 240 pcs      │ │
│  │ 💰 ¥12.50          │  │ 💰 ¥8.30           │  │ 💰 ¥15.20          │ │
│  │ 🟢 启用            │  │ 🔴 禁用            │  │ 🟢 启用            │ │
│  │ ────────────────  │  │ ────────────────  │  │ ────────────────  │ │
│  │ [查看][编辑][复制][删除]│  │ [查看][编辑][复制][删除]│  │ [查看][编辑][复制][删除]│ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ 共 24 条记录                                    1 / 3 页  [<] 1 2 3 [>]  │
└─────────────────────────────────────────────────────────────────────────┘
```

## CSS Styles

```css
/* 筛选栏布局 */
.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.view-toggle {
  margin-left: auto;  /* 推到最右边 */
}

/* 卡片网格布局 */
.config-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1199px) {
  .config-cards { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 991px) {
  .config-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 767px) {
  .config-cards { grid-template-columns: 1fr; }
}

/* 卡片样式 */
.config-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  transition: box-shadow 0.3s;
}

.config-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.config-name {
  font-size: 14px;
  color: #606266;
}

/* 产品类别圆形标识 */
.category-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

/* 卡片内容 */
.card-body {
  padding: 0 16px 16px;
}

/* 操作栏 */
.card-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}
```
