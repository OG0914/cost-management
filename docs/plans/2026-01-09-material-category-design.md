# 原料类别功能设计

## 概述
为原料管理添加类别功能，支持在系统配置中管理类别，原料新增时选择类别，并支持按类别筛选。

## 设计方案

### 1. 数据库变更

**system_config 表**新增配置：
- `config_key`: `material_categories`
- `config_value`: `[{"name":"塑料","sort":1},{"name":"金属","sort":2},{"name":"纸品","sort":3}]`

**materials 表**新增字段：
```sql
ALTER TABLE materials ADD COLUMN category VARCHAR(50);
```

### 2. 后端API

复用现有API，扩展字段：
- `GET /config` - 返回material_categories配置
- `PUT /config/:key` - 更新类别列表
- `GET/POST/PUT /materials` - 增加category字段
- 导入/导出Excel增加类别列

### 3. 前端-系统配置页面

新增"基础数据配置"Tab：
- 原料类别管理卡片
- 类别列表：名称输入框 + 排序数字 + 删除按钮
- 新增类别按钮 + 保存按钮

### 4. 前端-原料管理页面

- 筛选栏：新增类别下拉筛选
- 表格：新增"类别"列
- 弹窗：新增"类别"下拉选择（非必填）
- 导入/导出：Excel增加类别列

## 实现步骤

1. 数据库迁移：添加category字段
2. 后端：修改Material模型和控制器
3. 后端：修改Excel导入导出
4. 前端：系统配置页面新增Tab
5. 前端：原料管理页面添加类别功能
6. 测试验证
