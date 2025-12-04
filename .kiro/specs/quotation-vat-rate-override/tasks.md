# Implementation Plan

- [x] 1. 数据库迁移 - 添加 vat_rate 字段



  - [x] 1.1 创建迁移脚本 `backend/db/migrations/014_add_vat_rate_to_quotations.sql`


    - 添加 `vat_rate REAL DEFAULT NULL` 字段到 quotations 表
    - _Requirements: 1.4_

- [x] 2. 后端 Model 层修改



  - [x] 2.1 修改 `backend/models/Quotation.js` 的 create 方法


    - INSERT 语句新增 vat_rate 字段
    - _Requirements: 1.4_
  - [x] 2.2 修改 `backend/models/Quotation.js` 的 update 方法


    - allowedFields 数组新增 'vat_rate'
    - _Requirements: 1.4_
  - [ ]* 2.3 编写属性测试 - 增值税率持久化 Round-Trip
    - **Property 3: 增值税率持久化 Round-Trip**
    - **Validates: Requirements 1.4, 4.2**

- [x] 3. 后端 Controller 层修改



  - [x] 3.1 修改 `backend/controllers/costController.js` 的 createQuotation 方法


    - 从 req.body 获取 vat_rate 参数
    - 验证 vat_rate 在 0-1 范围内
    - 覆盖 calculatorConfig.vatRate
    - 保存 vat_rate 到报价单
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 3.2 修改 `backend/controllers/costController.js` 的 updateQuotation 方法


    - 同 createQuotation 的 vat_rate 处理逻辑
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 3.3 修改 `backend/controllers/costController.js` 的 calculateQuotation 方法


    - 支持 vat_rate 参数用于实时计算
    - _Requirements: 1.2_
  - [x] 3.4 修改 `backend/controllers/costController.js` 的 getQuotationDetail 方法


    - 返回结果中包含 vat_rate 和实际使用的税率
    - _Requirements: 2.3_
  - [x]* 3.5 编写属性测试 - 增值税率验证





    - **Property 2: 增值税率验证**
    - **Validates: Requirements 1.3**


  - [ ]* 3.6 编写属性测试 - 内销价格计算正确性
    - **Property 1: 内销价格计算正确性**
    - **Validates: Requirements 1.2, 2.1, 2.2**
  - [ ]* 3.7 编写属性测试 - 外销计算独立性
    - **Property 4: 外销计算独立性**
    - **Validates: Requirements 3.2**

- [x] 4. Checkpoint - 确保后端测试通过

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 前端报价单创建页面修改




  - [x] 5.1 修改 `frontend/src/views/cost/CostAdd.vue` 表单数据




    - form 对象新增 vat_rate 字段
    - 初始化时从 configStore 获取默认值
    - _Requirements: 1.1, 4.1_


  - [ ] 5.2 添加增值税率输入框 UI 组件
    - 仅在 sales_type === 'domestic' 时显示
    - 使用 el-input-number，min=0, max=1, precision=2


    - 显示当前百分比和系统默认值提示
    - _Requirements: 1.1, 3.1, 3.3_

  - [-] 5.3 修改成本计算结果标签为动态显示


    - 将硬编码的"含13%增值税"改为动态显示实际税率




    - 格式：`最终成本价（含${vatRate*100}%增值税）`
    - _Requirements: 2.1, 2.2_
  - [ ] 5.4 修改 calculateCost 方法
    - 调用后端 API 时传入 vat_rate 参数
    - _Requirements: 1.2_
  - [ ] 5.5 修改 saveDraft 和 submitQuotation 方法
    - 提交数据时包含 vat_rate 字段
    - _Requirements: 1.4_
  - [ ] 5.6 处理编辑模式和复制模式
    - 编辑时从报价单数据加载 vat_rate
    - 复制时继承原报价单的 vat_rate
    - _Requirements: 4.2, 4.3_
  - [ ]* 5.7 编写属性测试 - 全局配置默认值继承
    - **Property 5: 全局配置默认值继承**
    - **Validates: Requirements 4.1**

- [x] 6. 前端报价单详情页面修改



  - [x] 6.1 修改 `frontend/src/views/cost/CostDetail.vue` 标签显示


    - 动态显示实际使用的增值税率
    - 从 quotation.vat_rate 或全局配置获取税率值
    - _Requirements: 2.3_

- [ ] 7. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
