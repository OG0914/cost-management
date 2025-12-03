# Requirements Document

## Introduction

本功能实现产品类别分类（口罩/半面罩）与标准成本管理。主要包括：
1. 新增产品类别，绑定原料损耗系数，口罩类使用÷0.97，半面罩类使用÷0.99
2. 新增报价单时先选择产品类别，根据产品类别+法规过滤型号
3. 新增标准成本功能，管理员/审核人可将报价单设为标准成本，供所有业务员参考复制
4. 标准成本支持版本管理，可追溯历史版本

## Glossary

- **Product_Category（产品类别）**: 产品的大类分类，如口罩、半面罩，绑定原料损耗系数
- **Material_Coefficient（原料系数）**: 原料计算时的损耗系数，口罩为0.97，半面罩为0.99
- **Standard_Cost（标准成本）**: 由管理员/审核人设置的参考成本，供业务员复制使用
- **Quotation（报价单）**: 用户创建的成本报价记录
- **Packaging_Config（包装配置）**: 型号+包装方式的组合配置

## Requirements

### Requirement 1

**User Story:** As a 管理员, I want to 管理产品类别和原料系数, so that 不同产品类别可以使用不同的原料计算公式。

#### Acceptance Criteria

1. THE System SHALL provide a product_categories table storing product category name and material_coefficient
2. WHEN a product category is created THEN THE System SHALL store the name and material_coefficient value
3. THE System SHALL support two default product categories: 口罩 (coefficient=0.97) and 半面罩 (coefficient=0.99)

### Requirement 2

**User Story:** As a 用户, I want to 在新增报价单时先选择产品类别, so that 系统可以根据产品类别过滤型号并应用正确的原料系数。

#### Acceptance Criteria

1. WHEN a user clicks the new quotation button THEN THE System SHALL display a modal dialog for selecting product category
2. WHEN a user selects a product category and confirms THEN THE System SHALL navigate to the quotation form page with the selected category
3. WHEN a user selects a regulation on the quotation form THEN THE System SHALL filter models by both product_category_id and regulation_id
4. WHEN calculating material subtotal THEN THE System SHALL apply the formula: subtotal = usage_amount × unit_price ÷ material_coefficient

### Requirement 3

**User Story:** As a 管理员/审核人, I want to 将报价单设为标准成本, so that 业务员可以参考标准成本快速创建报价单。

#### Acceptance Criteria

1. WHEN an admin or reviewer views a quotation detail page THEN THE System SHALL display a "设为标准成本" button
2. WHEN a non-admin/non-reviewer user views a quotation detail page THEN THE System SHALL hide the "设为标准成本" button
3. WHEN an admin clicks the "设为标准成本" button THEN THE System SHALL display a confirmation dialog
4. WHEN the user confirms setting standard cost THEN THE System SHALL create a new standard_cost record linked to the quotation
5. IF a standard cost already exists for the same packaging_config THEN THE System SHALL create a new version and mark the old version as non-current

### Requirement 4

**User Story:** As a 用户, I want to 查看标准成本列表, so that 我可以参考标准成本并复制创建新报价单。

#### Acceptance Criteria

1. THE System SHALL display a "标准成本" tab on the quotation management page as the default tab
2. WHEN a user views the standard cost tab THEN THE System SHALL display all current standard costs with columns: 产品类别, 型号, 包装方式, 数量, 最终价格, 版本, 设置人, 设置时间, 操作
3. THE System SHALL provide filter options for product category and model name
4. WHEN a user clicks the copy button THEN THE System SHALL navigate to the new quotation page with pre-filled data from the standard cost

### Requirement 5

**User Story:** As a 管理员/审核人, I want to 管理标准成本版本历史, so that 我可以追溯和恢复历史版本。

#### Acceptance Criteria

1. WHEN an admin clicks the "历史" button on a standard cost row THEN THE System SHALL display a modal showing all versions of that standard cost
2. THE history modal SHALL display columns: 版本, 数量, 最终价格, 设置人, 设置时间, 状态, 操作
3. WHEN an admin clicks the "恢复" button on a historical version THEN THE System SHALL create a new version with the same data and mark it as current
4. WHEN a non-admin user views the standard cost list THEN THE System SHALL hide the "历史" and "删除" buttons

### Requirement 6

**User Story:** As a 管理员/审核人, I want to 删除标准成本, so that 我可以移除不再需要的标准成本。

#### Acceptance Criteria

1. WHEN an admin clicks the "删除" button on a standard cost row THEN THE System SHALL display a confirmation dialog
2. WHEN the user confirms deletion THEN THE System SHALL remove all versions of that standard cost from the database
3. WHEN a non-admin user views the standard cost list THEN THE System SHALL hide the "删除" button

### Requirement 7

**User Story:** As a 用户, I want to 在报价单记录Tab查看报价单, so that 我可以管理自己的报价单。

#### Acceptance Criteria

1. THE System SHALL display a "报价单记录" tab on the quotation management page
2. WHEN a regular user views the quotation records tab THEN THE System SHALL display only quotations created by that user
3. WHEN an admin or reviewer views the quotation records tab THEN THE System SHALL display all quotations from all users
4. THE quotation records tab SHALL maintain all existing columns and functionality without changes
