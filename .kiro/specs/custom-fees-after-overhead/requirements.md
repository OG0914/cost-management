# Requirements Document

## Introduction

本功能为成本分析系统新增"管销后自定义费用"功能。在某些特殊成本场景（如外销）中，管销价计算完成后还需要加入关税、服务费等额外费用。这些费用按照百分比依次累乘计算，最终再除以汇率并乘以保险率得到最终成本价。

## Glossary

- **管销价（Overhead Price）**: 基础成本价除以(1-管销率)得到的价格
- **自定义费用（Custom Fee）**: 用户可配置的额外费用项，包含费用名称和费率
- **费率（Fee Rate）**: 以小数表示的百分比，如4%表示为0.04
- **累乘计算（Cumulative Multiplication）**: 每项费用基于前一项计算结果进行乘法运算，公式为：前值 × (1 + 费率)
- **总结金额（Summary Amount）**: 所有自定义费用累乘计算后的最终金额
- **最终成本价（Final Cost Price）**: 经过所有费用计算后的最终价格

## Requirements

### Requirement 1

**User Story:** As a 成本核算员, I want to 在管销价计算后添加自定义费用项, so that 我可以准确计算包含关税、服务费等额外费用的最终成本。

#### Acceptance Criteria

1. WHEN 用户在成本计算区域的"自定义费用"栏位点击"添加"按钮 THEN 系统 SHALL 弹出费用添加对话框供用户输入费用名称和费率
2. WHEN 用户输入费用名称和费率并确认 THEN 系统 SHALL 在自定义费用区域显示新增的费用项及其计算结果
3. WHEN 用户点击费用项的删除按钮 THEN 系统 SHALL 从费用列表中移除该项并重新计算总结金额
4. WHEN 自定义费用列表为空 THEN 系统 SHALL 按原有逻辑计算最终成本价（管销价÷汇率×保险率）

### Requirement 2

**User Story:** As a 成本核算员, I want to 系统按正确顺序累乘计算自定义费用, so that 最终成本价计算结果准确。

#### Acceptance Criteria

1. WHEN 存在多个自定义费用项 THEN 系统 SHALL 按费用列表顺序依次累乘计算（每项费用结果 = 前一项结果 × (1 + 当前费率)）
2. WHEN 存在自定义费用 THEN 系统 SHALL 在费用列表末尾显示"总结"行，展示累乘计算的最终金额
3. WHEN 计算外销最终成本价 THEN 系统 SHALL 将总结金额除以汇率，再乘以保险率
4. WHEN 计算内销最终成本价 THEN 系统 SHALL 将总结金额乘以(1+增值税率)

### Requirement 3

**User Story:** As a 成本核算员, I want to 查看费用项信息, so that 我可以了解已添加的费用。

#### Acceptance Criteria

1. WHEN 显示费用项 THEN 系统 SHALL 展示费用名称和费率百分比
2. WHEN 费用或参数变更 THEN 系统 SHALL 实时更新总结金额

### Requirement 4

**User Story:** As a 成本核算员, I want to 保存和加载自定义费用配置, so that 我可以在编辑报价单时保留之前设置的费用项。

#### Acceptance Criteria

1. WHEN 用户保存报价单 THEN 系统 SHALL 将自定义费用列表（包含名称、费率、排序）持久化到数据库
2. WHEN 用户打开已保存的报价单 THEN 系统 SHALL 加载并显示之前保存的自定义费用项
3. WHEN 用户复制报价单 THEN 系统 SHALL 同时复制自定义费用配置

### Requirement 5

**User Story:** As a 成本核算员, I want to 输入有效的费率值, so that 系统能正确计算费用。

#### Acceptance Criteria

1. WHEN 用户输入费率 THEN 系统 SHALL 验证费率为有效的数值（大于0的小数）
2. WHEN 用户输入无效费率 THEN 系统 SHALL 显示错误提示并阻止添加
3. WHEN 用户未输入费用名称 THEN 系统 SHALL 显示错误提示并阻止添加
