# Requirements Document

## Introduction

本功能允许用户在创建报价单时自定义增值税率，而不是强制使用系统全局配置的增值税率。系统默认增值税率为 13%，但某些内销报价单可能需要使用 10% 或其他税率。通过在报价单级别支持增值税率覆盖，用户可以灵活处理不同税率场景，同时不影响其他报价单和全局配置。

## Glossary

- **System（系统）**: 成本分析报价系统
- **VAT Rate（增值税率）**: 增值税的百分比，用于计算内销价格
- **Quotation（报价单）**: 包含成本明细和报价信息的单据
- **Global Config（全局配置）**: 系统级别的配置参数，影响所有新建报价单的默认值
- **Override（覆盖）**: 在报价单级别使用自定义值替代全局默认值

## Requirements

### Requirement 1

**User Story:** As a 报价员, I want to 在创建报价单时自定义增值税率, so that 我可以为不同客户或产品使用不同的税率（如 10% 或 13%）。

#### Acceptance Criteria

1. WHEN 用户创建新的内销报价单 THEN System SHALL 显示增值税率输入框，默认值为系统全局配置的增值税率
2. WHEN 用户修改增值税率输入框的值 THEN System SHALL 使用用户输入的税率重新计算内销价格
3. WHEN 用户输入的增值税率不在 0 到 1 之间 THEN System SHALL 显示验证错误提示并阻止保存
4. WHEN 报价单保存成功 THEN System SHALL 将用户设置的增值税率持久化存储到报价单记录中

### Requirement 2

**User Story:** As a 报价员, I want to 在成本计算结果中看到实际使用的增值税率, so that 我可以确认报价单使用了正确的税率。

#### Acceptance Criteria

1. WHEN 内销报价单的成本计算结果显示时 THEN System SHALL 在"最终成本价"标签中显示实际使用的增值税率百分比（如"最终成本价（含10%增值税）"）
2. WHEN 用户修改增值税率 THEN System SHALL 立即更新标签中显示的税率百分比
3. WHEN 查看已保存的报价单详情 THEN System SHALL 显示该报价单保存时使用的增值税率

### Requirement 3

**User Story:** As a 报价员, I want to 外销报价单不受增值税率影响, so that 外销计算逻辑保持不变。

#### Acceptance Criteria

1. WHEN 用户选择外销类型 THEN System SHALL 隐藏增值税率输入框
2. WHEN 销售类型从内销切换到外销 THEN System SHALL 在计算中忽略增值税率参数
3. WHEN 销售类型从外销切换到内销 THEN System SHALL 恢复显示增值税率输入框并使用之前设置的值或默认值

### Requirement 4

**User Story:** As a 管理员, I want to 全局配置的增值税率作为默认值, so that 大部分报价单仍然使用标准税率而无需手动设置。

#### Acceptance Criteria

1. WHEN 系统全局增值税率配置被修改 THEN System SHALL 将新值作为后续新建报价单的默认增值税率
2. WHEN 已保存的报价单被查看或编辑 THEN System SHALL 使用该报价单保存时的增值税率，而非当前全局配置值
3. WHEN 复制已有报价单创建新报价单 THEN System SHALL 继承原报价单的增值税率作为默认值
