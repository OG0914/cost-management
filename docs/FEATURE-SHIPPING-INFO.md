# 外销货运信息功能

## 功能说明

在新增/编辑报价单页面，当用户选择"外销"作为销售类型时，系统会显示额外的货运信息字段：

1. **货运方式**：用户可以选择
   - 整柜 (FCL - Full Container Load)
   - 散货 (LCL - Less than Container Load)

2. **港口**：当选择货运方式后，显示港口输入框
   - 示例：FOB深圳、FOB上海等
   - 该字段不预设任何默认值，由用户自行填写

## 数据库变更

### 新增字段

在 `quotations` 表中新增两个字段：

- `shipping_method` TEXT - 货运方式（fcl/lcl），可为空
- `port` TEXT - 港口信息，可为空

### 迁移文件

- `backend/db/migrations/006_add_shipping_info.sql`

## 前端变更

### 文件修改

1. **frontend/src/views/cost/CostAdd.vue**
   - 在销售类型选择后添加货运方式和港口字段
   - 仅在选择"外销"时显示货运方式
   - 仅在选择货运方式后显示港口输入框
   - 表单数据中新增 `shipping_method` 和 `port` 字段
   - 保存和提交时包含这两个字段

2. **frontend/src/views/cost/CostDetail.vue**
   - 在报价单详情页显示货运方式和港口信息
   - 仅在外销且有数据时显示
   - 添加"包装方式"字段显示

3. **frontend/src/views/cost/CostRecords.vue**
   - 在报价单列表中添加"类型"列（内销/外销），位于"报价单编号"旁边
   - 在报价单列表中添加"包装方式"列，位于"型号"旁边
   - 包装方式显示配置名称和详细规格（如：1pc/10bags/12boxes）
   - 使用不同颜色的标签区分内销（绿色）和外销（橙色）

## 后端变更

### 文件修改

1. **backend/controllers/costController.js**
   - `createQuotation` 函数：接收并保存 `shipping_method` 和 `port`
   - `updateQuotation` 函数：接收并更新 `shipping_method` 和 `port`

2. **backend/models/Quotation.js**
   - `create` 方法：在 INSERT 语句中包含新字段
   - `update` 方法：在允许更新的字段列表中添加新字段
   - `findAll` 方法：在查询中关联 `packaging_configs` 表，返回包装配置名称及详细规格（pc_per_bag, bags_per_box, boxes_per_carton）
   - `findById` 方法：在查询中关联 `packaging_configs` 表，返回包装配置名称及详细规格

## 使用流程

1. 用户进入"新增报价单"页面
2. 选择"外销"作为销售类型
3. 系统显示"货运方式"选项（整柜/散货）
4. 用户选择货运方式后，显示"港口"输入框
5. 用户填写港口信息（如：FOB深圳）
6. 保存或提交报价单时，这些信息会一并保存

## 注意事项

- 货运方式和港口信息仅在外销时需要填写
- 切换回内销时，这些字段会被清空
- 港口字段不做格式验证，用户可以自由填写
- 这些字段在报价单详情页会显示，但不影响成本计算
