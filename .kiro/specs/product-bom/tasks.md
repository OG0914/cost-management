# Implementation Plan

- [x] 1. 数据库迁移




  - [x] 1.1 创建 model_bom_materials 表迁移脚本

    - 创建表结构：id, model_id, material_id, usage_amount, sort_order, is_active, created_at, updated_at
    - 添加外键约束：model_id → models(id) ON DELETE CASCADE, material_id → materials(id)
    - 添加唯一约束：UNIQUE(model_id, material_id)
    - 添加索引：idx_bom_model_id, idx_bom_material_id
    - _Requirements: 5.5, 5.3_

- [x] 2. 后端 BOM 模块开发



  - [x] 2.1 创建 BOM 数据模型 (backend/models/ModelBom.js)


    - 实现 findByModelId() - 查询型号BOM并JOIN原料表获取单价
    - 实现 create() - 添加BOM原料项
    - 实现 update() - 更新用量和排序
    - 实现 delete() - 删除BOM原料项
    - 实现 batchUpdate() - 批量更新
    - _Requirements: 1.2, 1.5, 2.1, 2.2, 2.3, 3.2_

  - [ ]* 2.2 编写 BOM 模型属性测试
    - **Property 2: BOM保存数据一致性**
    - **Property 3: BOM删除后不可查询**
    - **Validates: Requirements 1.5, 2.1, 2.2**


  - [x] 2.3 创建 BOM 控制器 (backend/controllers/bomController.js)

    - 实现 getBomByModelId() - 获取型号BOM清单
    - 实现 createBomItem() - 添加原料到BOM（含验证）
    - 实现 updateBomItem() - 更新BOM原料项
    - 实现 deleteBomItem() - 删除BOM原料项
    - 实现数据验证：原料存在性、用量正数、唯一性
    - _Requirements: 1.2, 1.5, 2.1, 2.2, 5.1, 5.2, 5.3_

  - [ ]* 2.4 编写 BOM 控制器属性测试
    - **Property 4: BOM原料唯一性约束**
    - **Property 5: BOM用量验证**
    - **Property 6: BOM原料存在性验证**
    - **Validates: Requirements 5.1, 5.2, 5.3**


  - [x] 2.5 创建 BOM 路由 (backend/routes/bomRoutes.js)

    - GET /api/bom/:modelId - 获取型号BOM
    - POST /api/bom - 添加BOM原料
    - PUT /api/bom/:id - 更新BOM原料
    - DELETE /api/bom/:id - 删除BOM原料
    - 注册路由到 server.js
    - _Requirements: 1.2, 1.5, 2.1, 2.2_

- [x] 3. Checkpoint - 确保后端测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 前端 BOM 配置功能
  - [x] 4.1 创建 BOM 配置弹窗组件 (frontend/src/components/BomConfigDialog.vue)
    - 原料下拉选择器（数据来源原料管理）
    - 用量输入框
    - BOM列表展示（原料名称、料号、单价、用量）
    - 添加/编辑/删除操作
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

  - [x] 4.2 修改型号管理页面 (frontend/src/views/model/ModelManage.vue)
    - 添加「配置BOM」按钮到操作列
    - 集成 BomConfigDialog 组件
    - _Requirements: 1.1_

  - [ ] 4.3 创建 BOM Store (frontend/src/store/bom.js)
    - fetchBomByModelId() - 获取型号BOM
    - addBomItem() - 添加BOM原料
    - updateBomItem() - 更新BOM原料
    - deleteBomItem() - 删除BOM原料
    - _Requirements: 1.2, 1.5, 2.1, 2.2_

- [x] 5. 前端报价联动功能
  - [x] 5.1 修改新增报价页面 (frontend/src/views/cost/CostAdd.vue)
    - 选择型号配置后调用BOM接口
    - 将BOM原料加载到原料明细区域
    - 原料单价从接口返回值获取（已JOIN原料表）
    - 标记BOM带出的原料（from_bom: true）
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.2 编写 BOM 加载属性测试
    - **Property 1: BOM查询返回完整原料信息**
    - **Validates: Requirements 1.2, 3.2, 3.4**

- [x] 6. 数据完整性保护
  - [x] 6.1 修改原料删除逻辑 (backend/controllers/materialController.js)
    - 删除原料前检查是否被BOM引用
    - 如被引用则返回警告信息
    - _Requirements: 5.4_

  - [ ]* 6.2 编写级联删除属性测试
    - **Property 7: 型号删除级联BOM**
    - **Validates: Requirements 5.5**

- [x] 7. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

