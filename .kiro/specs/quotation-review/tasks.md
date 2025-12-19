# 报价单审核流程 - 实现计划

## 1. 数据库迁移和后端基础设施

- [x] 1.1 创建审核历史表迁移脚本
  - 创建 `backend/db/migrations/004_add_review_history.sql`
  - 添加 review_history 表结构
  - 添加索引
  - _Requirements: 5.4, 6.7, 9.4_

- [x] 1.2 创建审核相关的后端路由和控制器
  - 创建 `backend/routes/reviewRoutes.js`
  - 创建 `backend/controllers/reviewController.js`
  - 创建 `backend/models/Comment.js`
  - 更新 `backend/middleware/auth.js` 添加 requireRole
  - 注册路由到 server.js
  - _Requirements: 1.1, 2.1, 3.1_

## 2. 后端API实现

- [x] 2.1 实现获取待审核列表API
  - GET /api/review/pending
  - 支持筛选：客户名称、型号、日期范围
  - 支持分页
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [ ]* 2.2 编写待审核列表API属性测试
  - **Property 1: 待审核列表状态过滤**
  - **Validates: Requirements 1.1**

- [x] 2.3 实现获取已审核列表API
  - GET /api/review/approved
  - 支持筛选：状态、客户名称、型号、日期范围
  - 支持分页
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.4 编写已审核列表API属性测试
  - **Property 2: 已审核列表状态过滤**
  - **Validates: Requirements 2.1**

- [x] 2.5 实现获取报价单审核详情API
  - GET /api/review/:id/detail
  - 返回报价单信息、明细项、标准配置对比、批注
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 2.6 实现审核通过API
  - POST /api/review/:id/approve
  - 更新状态为approved
  - 记录审核人和审核时间
  - 保存审核批注
  - 记录审核历史
  - _Requirements: 4.5, 4.6_

- [ ]* 2.7 编写审核通过API属性测试
  - **Property 3: 审核通过状态转换**
  - **Validates: Requirements 4.5, 4.6**

- [x] 2.8 实现审核退回API
  - POST /api/review/:id/reject
  - 验证退回原因必填
  - 更新状态为rejected
  - 保存退回原因到comments表
  - 记录审核历史
  - _Requirements: 5.5, 5.6, 5.7_

- [ ]* 2.9 编写审核退回API属性测试
  - **Property 4: 审核退回状态转换**
  - **Property 9: 退回原因必填验证**
  - **Validates: Requirements 5.5, 5.6, 5.7**

- [x] 2.10 实现重新提交API
  - POST /api/review/:id/resubmit
  - 更新状态为submitted
  - 记录审核历史
  - _Requirements: 9.3, 9.4_

- [ ]* 2.11 编写重新提交API属性测试
  - **Property 5: 重新提交状态转换**
  - **Validates: Requirements 9.3, 9.4**

- [x] 2.12 实现删除报价单API（仅管理员）
  - DELETE /api/review/:id
  - 验证管理员权限
  - _Requirements: 1.5, 2.7_

- [ ] 3. Checkpoint - 确保所有后端测试通过
  - Ensure all tests pass, ask the user if questions arise.

## 4. 前端Store和工具函数

- [x] 4.1 创建审核状态管理Store
  - 创建 `frontend/src/store/review.js`
  - 实现待审核列表状态管理
  - 实现已审核列表状态管理
  - 实现API调用方法
  - _Requirements: 1.1, 2.1_

- [x] 4.2 创建审核相关工具函数
  - 创建 `frontend/src/utils/review.js`
  - 差异计算函数（对比标准配置）
  - 利润报价计算函数
  - 状态标签颜色映射
  - 日期/金额/数量格式化函数
  - _Requirements: 3.4, 3.5, 3.6, 13.5_

## 5. 前端页面组件实现

- [x] 5.1 创建待审核记录页面
  - 创建 `frontend/src/views/review/PendingReview.vue`
  - 实现列表展示（报价单编号、状态、类型、客户名称等）
  - 实现筛选功能
  - 实现分页
  - 实现[审核]按钮打开弹窗
  - 实现[删除]按钮（仅管理员可见）
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]* 5.2 编写待审核记录页面属性测试
  - **Property 7: 角色权限控制 - 删除按钮**
  - **Validates: Requirements 1.5**

- [x] 5.3 创建已审核记录页面
  - 创建 `frontend/src/views/review/ApprovedReview.vue`
  - 实现列表展示（含状态筛选：已通过/已退回）
  - 实现筛选功能
  - 实现分页
  - 实现[查看]按钮打开弹窗
  - 实现[删除]按钮（仅管理员可见）
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

## 6. 前端弹窗组件实现

- [x] 6.1 创建审核详情弹窗组件（完整视图）
  - 创建 `frontend/src/components/review/ReviewDetailDialog.vue`
  - 实现弹窗形式，右上角X关闭按钮
  - 实现基本信息展示（4字符对齐栏位名称）
  - 实现成本明细Tab切换（原料/工序/包材）
  - 实现差异高亮显示
  - 实现价格汇总和利润报价展示
  - 实现[通过][退回]按钮居中显示
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 6.2 创建已审核详情弹窗组件（简略视图）
  - 创建 `frontend/src/components/review/ApprovedDetailDialog.vue`
  - 实现弹窗形式，右上角X关闭按钮和导出按钮
  - 实现报价单摘要展示
  - 实现审核结果展示（审核时间右下角）
  - 实现成本构成比例展示
  - 实现审核历史时间线
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 6.3 创建通过确认弹窗组件
  - 创建 `frontend/src/components/review/ApproveConfirmDialog.vue`
  - 显示报价单摘要信息
  - 显示利润区间报价
  - 可选审核批注输入框
  - 按钮居中显示
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6.4 创建退回确认弹窗组件
  - 创建 `frontend/src/components/review/RejectConfirmDialog.vue`
  - 显示报价单摘要信息
  - 显示利润区间报价
  - 必填退回原因输入框
  - 按钮居中显示
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

## 7. 业务员视图组件实现

- [x] 7.1 创建业务员查看退回报价单弹窗
  - 创建 `frontend/src/components/review/RejectedDetailDialog.vue`
  - 显示退回通知和退回原因
  - 显示[编辑][重新提交]按钮
  - 显示审核历史时间线
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 7.2 扩展报价单编辑页面支持退回编辑
  - 修改 `frontend/src/views/cost/CostAdd.vue` 或创建新组件
  - 显示退回原因提示
  - 用量字段可编辑，单价字段只读
  - 显眼位置的[+ 添加原料]按钮
  - 实时计算价格汇总和利润报价
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 7.3 编写编辑权限属性测试
  - **Property 10: 编辑权限 - 单价只读**
  - **Validates: Requirements 8.3, 8.4**

- [x] 7.4 创建重新提交确认弹窗
  - 创建 `frontend/src/components/review/ResubmitConfirmDialog.vue`
  - 显示报价单摘要和利润区间报价
  - 按钮居中显示
  - _Requirements: 9.1, 9.2_

- [x] 7.5 创建业务员查看审核通过报价单弹窗
  - 创建 `frontend/src/components/review/SalespersonApprovedDialog.vue`
  - 显示基本信息和报价信息（最终价格+利润档位）
  - 显示审核结果和批注
  - 显示审核流程时间线
  - 不显示复制按钮
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

## 8. 菜单和路由配置

- [x] 8.1 更新菜单配置
  - 修改 `frontend/src/config/menuConfig.js`
  - 添加"审核管理"菜单组（独立于成本管理）
  - 添加"待审核记录"和"已审核记录"子菜单
  - 配置角色权限（仅admin和reviewer可见）
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 8.2 编写菜单权限属性测试
  - **Property 6: 角色权限控制 - 菜单可见性**
  - **Validates: Requirements 11.4, 11.5**

- [x] 8.3 更新路由配置
  - 修改 `frontend/src/router/index.js`
  - 添加待审核记录路由 `/review/pending`
  - 添加已审核记录路由 `/review/approved`
  - 配置路由守卫（requiresReviewer权限控制）
  - _Requirements: 12.1, 12.2, 12.3_

## 9. 公共组件和样式

- [x] 9.1 创建报价单摘要组件
  - 创建 `frontend/src/components/review/QuotationSummary.vue`
  - 支持完整视图和简略视图模式
  - 4字符对齐栏位名称
  - _Requirements: 13.1_

- [x] 9.2 创建成本明细Tab组件
  - 创建 `frontend/src/components/review/CostDetailTabs.vue`
  - 支持原料/工序/包材切换
  - 支持差异高亮显示
  - 支持编辑模式
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 9.3 创建差异高亮行组件
  - 创建 `frontend/src/components/review/DiffHighlightRow.vue`
  - 实现颜色规范（一致:白色、修改:浅蓝、新增:浅绿、删除:浅红）
  - _Requirements: 13.4_

- [x] 9.4 创建审核历史时间线组件
  - 创建 `frontend/src/components/review/ReviewTimeline.vue`
  - 完整日期格式（YYYY-MM-DD HH:mm）
  - _Requirements: 13.3_

- [x] 9.5 创建利润区间报价组件
  - 创建 `frontend/src/components/review/ProfitPricing.vue`
  - 显示5%、10%、25%、50%利润报价
  - _Requirements: 3.6, 4.2, 5.2_

- [x] 9.6 添加状态标签样式
  - 更新 `frontend/src/styles/index.css`
  - 草稿:灰色、已提交:黄色、已通过:绿色、已退回:红色
  - _Requirements: 13.5_

## 10. 权限控制实现

- [x] 10.1 实现页面访问权限控制
  - 管理员：可审核、可删除、可查看所有报价单
  - 审核人：可审核、不可删除、可查看所有报价单
  - 业务员：可访问审核管理页面，但只能查看自己提交的报价单（不能审核）
  - 只读用户：不可访问审核管理页面
  - 前端路由守卫 `requiresReviewAccess` 已配置（admin/reviewer/salesperson可访问）
  - 后端API根据角色过滤数据（salesperson只能看自己的）
  - 删除按钮通过 `v-if="isAdmin"` 控制
  - 审核按钮通过 `v-if="canReview"` 控制（仅admin/reviewer可见）
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 10.2 实现视图模式切换
  - 管理员/审核人：完整视图（成本明细）
  - 业务员/只读：简略视图（摘要+成本构成比例）
  - 修改 `frontend/src/views/cost/CostDetail.vue` 添加 `isFullView` 计算属性
  - 简略视图显示成本构成比例卡片，隐藏详细明细表格
  - _Requirements: 12.4, 12.5, 12.6_

- [ ] 11. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
