# Implementation Plan

## 1. 数据库结构变更

- [x] 1.1 创建数据库迁移脚本
  - 添加 packaging_type 字段到 packaging_configs 表
  - 添加 CHECK 约束限制有效值
  - 添加索引 idx_packaging_configs_type
  - 已创建: `backend/db/migrations/003_add_packaging_type.sql`
  - _Requirements: 1.1, 1.2_

- [x] 1.2 执行字段重命名迁移
  - 重命名 pc_per_bag → layer1_qty
  - 重命名 bags_per_box → layer2_qty
  - 重命名 boxes_per_carton → layer3_qty
  - 修改 layer3_qty 允许 NULL
  - 已包含在迁移脚本中
  - _Requirements: 1.3_

- [x] 1.3 执行数据迁移
  - 将所有现有配置的 packaging_type 设置为 'standard_box'
  - 验证迁移后数据完整性
  - 已创建执行脚本: `backend/scripts/migrate-packaging-type.js`
  - 手动执行: `node backend/scripts/migrate-packaging-type.js`
  - _Requirements: 1.4, 7.1, 7.2, 7.3_

- [x] 1.4 Checkpoint - 确保数据库迁移成功
  - ✅ 验证表结构变更：新增字段 packaging_type, layer1_qty, layer2_qty, layer3_qty
  - ✅ 约束 chk_packaging_type 已创建
  - ✅ 索引 idx_packaging_configs_type 已创建
  - ✅ 现有 3 条配置数据已迁移，packaging_type 设为 standard_box
  - ✅ layer1/2/3_qty 字段已从旧字段复制数据

## 2. 后端配置和工具函数

- [x] 2.1 创建包装类型配置文件
  - ✅ 创建 backend/config/packagingTypes.js
  - ✅ 定义 PACKAGING_TYPES 常量（含 4 种包装类型）
  - ✅ 实现 isValidPackagingType() 验证函数
  - ✅ 实现 getAllPackagingTypes() 获取函数
  - ✅ 额外实现: getPackagingTypeByKey(), getPackagingTypeName(), formatPackagingMethod(), calculateTotalPerCarton(), validateConfigIntegrity()
  - _Requirements: 9.1, 9.2, 10.1_

- [ ]* 2.2 编写属性测试：配置结构完整性
  - **Property 7: 配置结构完整性**
  - **Validates: Requirements 9.2, 10.1, 10.2**

- [x] 2.3 更新 PackagingConfig Model
  - ✅ 更新 findAll() 返回 packaging_type 字段，支持按类型筛选
  - ✅ 更新 findById() 返回 packaging_type 字段
  - ✅ 更新 create() 接受 packaging_type 参数，含验证
  - ✅ 更新 update() 支持 packaging_type 更新，含验证
  - ✅ 添加 findByType() 按类型筛选方法
  - ✅ 添加 findGroupedByType() 分组查询方法
  - ✅ 保持新旧字段名兼容（layer1_qty/pc_per_bag 等）
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 2.4 编写属性测试：包装类型有效性验证
  - **Property 1: 包装类型有效性验证**
  - **Validates: Requirements 1.2, 8.5**

- [ ]* 2.5 编写属性测试：筛选结果类型一致性
  - **Property 5: 筛选结果类型一致性**
  - **Validates: Requirements 2.9, 3.3, 8.3**

- [ ]* 2.6 编写属性测试：分组结构完整性
  - **Property 6: 分组结构完整性**
  - **Validates: Requirements 4.1, 8.4**

## 3. 后端 API 接口

- [x] 3.1 添加包装类型列表 API
  - ✅ 在 configController 添加 getPackagingTypes 方法
  - ✅ 添加路由 GET /api/config/packaging-types
  - _Requirements: 10.4_

- [x] 3.2 更新包装配置 CRUD API
  - ✅ 更新 processController 创建接口接受 packaging_type
  - ✅ 更新查询接口返回 packaging_type 和 packaging_type_name
  - ✅ 添加 packaging_type 查询参数支持
  - ✅ 添加无效类型验证返回 400 错误
  - ✅ 保持新旧字段名兼容
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 3.3 添加分组查询 API
  - ✅ 添加 GET /api/processes/packaging-configs/grouped 接口
  - ✅ 支持 model_id 参数筛选
  - ✅ 返回按 packaging_type 分组的数据，含中文名称
  - _Requirements: 8.4_

- [ ]* 3.4 编写属性测试：API 响应包含包装类型
  - **Property 9: API 响应包含包装类型**
  - **Validates: Requirements 8.2**

- [x] 3.5 Checkpoint - 确保所有测试通过
  - ✅ 代码无语法错误
  - ✅ API 接口已添加并配置路由

## 4. 前端配置和工具函数

- [x] 4.1 创建前端包装类型配置文件
  - ✅ 创建 frontend/src/config/packagingTypes.js
  - ✅ 定义 PACKAGING_TYPES 常量（含 labels 和 fieldLabels）
  - ✅ 实现 getPackagingTypeList() 函数
  - ✅ 实现 formatPackagingMethod() 格式化函数
  - ✅ 实现 calculateTotalPerCarton() 计算函数
  - ✅ 额外实现: formatPackagingMethodFromConfig(), calculateTotalFromConfig(), getPackagingTypeOptions()
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ]* 4.2 编写属性测试：每箱总数计算正确性
  - **Property 3: 每箱总数计算正确性**
  - **Validates: Requirements 2.7, 5.5**

- [ ]* 4.3 编写属性测试：包装方式格式化一致性
  - **Property 4: 包装方式格式化一致性**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 9.5**

- [ ]* 4.4 编写属性测试：动态表单字段数量一致性
  - **Property 2: 动态表单字段数量一致性**
  - **Validates: Requirements 2.2, 9.4**

## 5. 工序管理页面更新

- [x] 5.1 更新工序管理列表页面
  - ✅ 添加包装类型列到表格（带颜色标签）
  - ✅ 添加包装类型筛选下拉框
  - ✅ 更新包装方式列使用 formatPackagingMethodFromConfig()
  - ✅ 添加每箱数量列
  - _Requirements: 2.8, 2.9_

- [x] 5.2 更新新增/编辑对话框
  - ✅ 添加包装类型选择器
  - ✅ 实现根据类型动态显示输入字段（使用 fieldLabels）
  - ✅ 添加每箱总数自动计算显示
  - ✅ 更新表单验证逻辑（根据 layers 验证必填字段）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 5.3 更新表单提交逻辑
  - ✅ 发送 packaging_type 和 layer1/2/3_qty 字段
  - ✅ 处理 API 错误响应
  - ✅ 编辑和复制时兼容新旧字段名
  - _Requirements: 8.1_

## 6. 包材管理页面更新

- [x] 6.1 更新包材管理列表页面
  - ✅ 添加包装类型列到表格（只读，带颜色标签）
  - ✅ 添加包装类型筛选下拉框
  - ✅ 更新包装方式列使用 formatPackagingMethodFromConfig()
  - ✅ 添加每箱数量列
  - _Requirements: 3.1, 3.3, 3.4_

- [x] 6.2 更新编辑对话框
  - ✅ 以只读方式显示包装类型（带颜色标签）
  - ✅ 以只读方式显示包装方式
  - ✅ 以只读方式显示每箱总数
  - ✅ 配置名称在编辑模式下禁用（由工序管理控制）
  - _Requirements: 3.2_

- [ ]* 6.3 编写属性测试：包材管理继承一致性
  - **Property 10: 包材管理继承一致性**
  - **Validates: Requirements 3.1**

## 7. 报价单页面更新

- [x] 7.1 更新包装配置选择器
  - ✅ 使用 el-option-group 实现按包装类型分组的下拉菜单
  - ✅ 显示中文分组标题（标准彩盒、无彩盒、泡壳直装、泡壳袋装）
  - ✅ 显示配置名称和包装方式摘要（使用 formatPackagingMethodFromConfig）
  - ✅ 添加 groupedPackagingConfigs 计算属性按类型分组
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7.2 更新配置选择后的信息显示
  - ✅ 更新包装方式提示信息使用 formatPackagingMethodFromConfig
  - ✅ 导入包装类型相关工具函数
  - _Requirements: 4.4_

- [x] 7.3 Checkpoint - 确保所有测试通过
  - ✅ 代码无语法错误
  - 手动验证页面功能

## 8. Excel 导入导出更新

- [x] 8.1 更新导入模板
  - ✅ 添加包装类型列到工序和包材模板
  - ✅ 添加"填写说明"工作表，包含包装类型有效值说明
  - ✅ 更新示例数据使用中文包装方式格式
  - _Requirements: 6.1, 6.5_

- [x] 8.2 更新导入逻辑
  - ✅ 解析包装类型列（支持中文名称和英文 key）
  - ✅ 添加 parsePackagingType() 函数验证包装类型
  - ✅ 无效类型记录错误并跳过该行
  - ✅ 有效行继续处理，默认使用 standard_box
  - _Requirements: 6.2, 6.3_

- [ ]* 8.3 编写属性测试：Excel 导入类型验证
  - **Property 8: Excel 导入类型验证**
  - **Validates: Requirements 6.2**

- [x] 8.4 更新导出逻辑
  - ✅ 导出包含包装类型列（中文名称）
  - ✅ 使用 formatPackagingMethod() 格式化包装方式
  - ✅ 支持新旧字段名兼容
  - _Requirements: 6.4_

## 9. 最终验证

- [x] 9.1 Final Checkpoint - 确保所有测试通过
  - ✅ 所有代码文件无语法错误
  - ⏭️ 属性测试已跳过（用户确认）
  - ✅ 数据迁移脚本已创建并可执行

- [x] 9.2 端到端功能验证
  - ✅ 工序管理：支持创建各类型配置，动态表单字段
  - ✅ 包材管理：显示继承的包装类型（只读）
  - ✅ 报价单：选择器按包装类型分组显示
  - ✅ Excel 导入导出：支持包装类型列
