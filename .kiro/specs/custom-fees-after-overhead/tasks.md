# Implementation Plan

## 管销后自定义费用功能

- [x] 1. 数据库迁移



  - [x] 1.1 创建 quotation_custom_fees 表迁移脚本


    - 创建 `backend/db/migrations/016_add_custom_fees.sql`
    - 包含 id, quotation_id, fee_name, fee_rate, sort_order, created_at, updated_at 字段
    - 添加外键约束和索引
    - _Requirements: 4.1_

- [x] 2. 后端核心计算逻辑




  - [x] 2.1 扩展 CostCalculator 类添加累乘计算方法

    - 在 `backend/utils/costCalculator.js` 中添加 `calculateCustomFeesSummary` 方法
    - 实现按顺序累乘计算逻辑：result = basePrice × (1 + rate1) × (1 + rate2) × ...
    - _Requirements: 2.1_
  - [ ]* 2.2 编写累乘计算属性测试
    - **Property 1: 累乘计算正确性**
    - **Validates: Requirements 2.1**
  - [x] 2.3 修改 calculateQuotation 方法支持自定义费用


    - 接收 customFees 参数
    - 使用总结金额替代管销价进行后续计算
    - _Requirements: 2.3, 2.4_
  - [ ]* 2.4 编写外销/内销计算属性测试
    - **Property 2: 外销最终成本价计算正确性**
    - **Property 3: 内销最终成本价计算正确性**
    - **Validates: Requirements 2.3, 2.4**

- [ ] 3. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 后端数据模型和API



  - [x] 4.1 创建 QuotationCustomFee 模型


    - 创建 `backend/models/QuotationCustomFee.js`
    - 实现 CRUD 操作方法
    - _Requirements: 4.1, 4.2_
  - [x] 4.2 修改 costController 支持自定义费用


    - 在保存报价单时保存自定义费用
    - 在加载报价单时加载自定义费用
    - 在复制报价单时复制自定义费用
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 4.3 编写费用数据往返属性测试
    - **Property 4: 费用数据往返一致性**
    - **Validates: Requirements 4.1, 4.2**

- [ ] 5. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. 前端UI实现



  - [x] 6.1 在 CostAdd.vue 添加自定义费用区域


    - 在管销价下方添加自定义费用栏位
    - 显示"添加"按钮
    - 有费用时显示费用列表和总结行
    - _Requirements: 1.1, 1.2, 2.2_

  - [ ] 6.2 实现添加费用对话框
    - 创建对话框组件，包含费用名称和费率输入
    - 每次打开时重置为空值
    - 实现表单验证

    - _Requirements: 1.1, 5.1, 5.2, 5.3_
  - [ ] 6.3 实现费用列表管理功能
    - 显示费用名称和费率百分比
    - 实现删除费用功能
    - 实时更新总结金额
    - _Requirements: 1.2, 1.3, 3.1, 3.2_
  - [x]* 6.4 编写费用验证属性测试



    - **Property 5: 费用验证正确性**
    - **Validates: Requirements 5.1**

- [x] 7. 前端计算逻辑集成



  - [x] 7.1 修改 calculateCost 方法


    - 将自定义费用传递给后端计算
    - 使用总结金额更新后续计算显示
    - _Requirements: 2.1, 2.3, 2.4_
  - [x] 7.2 实现费用数据保存和加载

    - 保存报价单时包含自定义费用
    - 加载报价单时恢复自定义费用
    - _Requirements: 4.1, 4.2_

- [ ] 8. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
