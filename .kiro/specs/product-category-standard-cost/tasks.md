# Implementation Plan

- [x] 1. 数据库和模型准备




  - [x] 1.1 添加原料系数配置到系统配置表




    - 在 system_config 表中插入 material_coefficients 配置
    - 配置值：{"口罩": 0.97, "半面罩": 0.99}
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 创建标准成本表

    - 创建 standard_costs 表
    - 创建索引
    - 创建迁移脚本


    - _Requirements: 3.4, 3.5_

  - [ ] 1.3 创建 StandardCost 模型
    - 实现 findAllCurrent, findById, findByPackagingConfigId 方法
    - 实现 getHistory, create, restore, deleteByPackagingConfigId 方法
    - _Requirements: 3.4, 3.5, 5.1, 5.3, 6.2_
  - [ ]* 1.4 编写属性测试：版本递增逻辑
    - **Property 5: Standard cost versioning on update**
    - **Validates: Requirements 3.5**

- [x] 2. 后端 API 开发



  - [x] 2.1 修改型号 API 支持 model_category 过滤


    - 修改 GET /api/models 支持 model_category 参数
    - 新增 GET /api/models/categories 获取所有型号分类
    - _Requirements: 2.3_
  - [ ]* 2.2 编写属性测试：型号过滤逻辑
    - **Property 1: Model filtering by model_category and regulation**
    - **Validates: Requirements 2.3**

  - [x] 2.3 创建标准成本路由和控制器

    - GET /api/standard-costs
    - GET /api/standard-costs/:id
    - GET /api/standard-costs/:id/history
    - POST /api/standard-costs
    - POST /api/standard-costs/:id/restore/:version
    - DELETE /api/standard-costs/:packaging_config_id
    - _Requirements: 3.4, 4.2, 5.1, 5.3, 6.2_
  - [x] 2.4 添加标准成本 API 权限控制

    - POST/DELETE 仅允许 admin/reviewer
    - _Requirements: 3.1, 3.2, 5.4, 6.3_
  - [ ]* 2.5 编写属性测试：权限控制
    - **Property 3: Standard cost button visibility by role**
    - **Property 8: History and delete buttons hidden for non-admin**
    - **Validates: Requirements 3.1, 3.2, 5.4**

- [ ] 3. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [-] 4. 修改成本计算逻辑

  - [x] 4.1 修改 costCalculator.js 支持原料系数


    - 添加 materialCoefficient 参数
    - 修改原料小计计算公式：subtotal = usage_amount × unit_price ÷ coefficient
    - _Requirements: 1.3, 2.4_
  - [ ]* 4.2 编写属性测试：原料计算公式
    - **Property 2: Material subtotal calculation with coefficient**
    - **Validates: Requirements 2.4**
  - [x] 4.3 修改 costController.js 传递原料系数








    - 根据型号的 model_category 获取对应的原料系数
    - 在计算接口中应用原料系数
    - _Requirements: 1.3, 2.4_

- [ ] 5. 前端产品类别选择功能
  - [x] 5.1 创建产品类别选择弹窗组件


    - 创建 ProductCategoryModal.vue
    - 从 /api/models/categories 获取型号分类列表
    - 显示口罩/半面罩等选项
    - _Requirements: 2.1_

  - [x] 5.2 修改新增报价单入口

    - 点击新增按钮时显示产品类别选择弹窗
    - 选择后跳转到新增页面并传递 model_category 参数
    - _Requirements: 2.1, 2.2_
  - [x] 5.3 修改 CostAdd.vue 支持产品类别过滤



    - 接收 model_category 参数
    - 根据 model_category + regulation_id 过滤型号
    - 原料计算使用对应系数
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 6. 前端标准成本Tab功能
  - [x] 6.1 修改 CostRecords.vue 增加Tab切换
    - 增加标准成本Tab和报价单记录Tab
    - 标准成本Tab为默认显示
    - _Requirements: 4.1, 7.1_
  - [x] 6.2 创建标准成本列表组件
    - 显示列表栏位：产品类别、型号、包装方式、数量、最终价格、版本、设置人、设置时间、操作
    - 实现筛选功能：产品类别、型号
    - _Requirements: 4.2, 4.3_
  - [x] 6.3 实现标准成本复制功能
    - 点击复制按钮显示产品类别选择弹窗（自动选中）
    - 跳转到新增报价单页面并预填充数据
    - _Requirements: 4.4_
  - [x] 6.4 实现标准成本历史弹窗
    - 创建历史版本弹窗组件
    - 显示所有版本列表
    - 实现恢复功能
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 6.5 实现标准成本删除功能
    - 点击删除按钮显示确认弹窗
    - 确认后删除所有版本
    - _Requirements: 6.1, 6.2_
  - [x] 6.6 实现权限控制

    - 普通用户只显示复制按钮
    - 管理员/审核人显示复制、历史、删除按钮
    - _Requirements: 5.4, 6.3_

- [x] 7. 前端报价单详情页修改
  - [x] 7.1 修改 CostDetail.vue 增加设为标准成本按钮
    - 仅管理员/审核人可见
    - 点击显示确认弹窗
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 7.2 实现设为标准成本功能

    - 调用 POST /api/standard-costs 接口
    - 成功后显示提示
    - _Requirements: 3.4, 3.5_

- [ ] 8. 前端报价单记录Tab权限控制
  - [ ] 8.1 修改报价单记录查询逻辑
    - 普通用户只查看自己创建的报价单
    - 管理员/审核人查看所有报价单
    - _Requirements: 7.2, 7.3_
  - [ ]* 8.2 编写属性测试：用户数据过滤
    - **Property 10: Quotation records filtered by user for regular users**
    - **Property 11: Quotation records show all for admin/reviewer**
    - **Validates: Requirements 7.2, 7.3**

- [ ] 9. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. 集成测试和收尾
  - [ ] 10.1 测试完整的设置标准成本流程
    - 创建报价单 → 设为标准成本 → 验证标准成本列表
    - _Requirements: 3.4_
  - [ ] 10.2 测试复制标准成本创建报价单流程
    - 复制标准成本 → 填写客户信息 → 保存报价单
    - _Requirements: 4.4_
  - [ ] 10.3 测试版本历史和恢复流程
    - 设置多个版本 → 查看历史 → 恢复历史版本
    - _Requirements: 5.1, 5.3_

- [ ] 11. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
