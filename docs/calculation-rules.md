# 计算规则配置说明

## 概述

`calculation_rules` 是一个系统配置项，用于定义半面罩产品的成本计算规则。通过修改此配置，可以动态调整不同计算类型的原料和包材计算公式及系数，**无需修改代码**。

## 配置结构

```json
{
  "半面罩": {
    "主体": {
      "material": { "formula": "multiply", "coefficient": 0.99 },
      "packaging": { "formula": "divide", "coefficient": 1 }
    },
    "配件": {
      "material": { "formula": "multiply", "coefficient": 0.99 },
      "packaging": { "formula": "divide", "coefficient": 1 }
    },
    "滤毒盒": {
      "material": { "formula": "multiply", "coefficient": 0.95 },
      "packaging": { "formula": "divide", "coefficient": 0.97 }
    },
    "滤棉": {
      "material": { "formula": "divide", "coefficient": 0.97 },
      "packaging": { "formula": "divide", "coefficient": 1 }
    },
    "滤饼": {
      "material": { "formula": "divide", "coefficient": 0.97 },
      "packaging": { "formula": "divide", "coefficient": 1 }
    }
  }
}
```

## 字段说明

| 字段 | 说明 | 可选值 |
|-----|------|--------|
| `formula` | 计算公式 | `multiply`: (用量 × 单价) ÷ 系数<br>`divide`: (单价 ÷ 用量) ÷ 系数 |
| `coefficient` | 计算系数 | 任意正数 |
| `material` | 原料计算规则 | - |
| `packaging` | 包材计算规则 | - |

## 当前规则矩阵

| 型号分类 | 计算类型 | 原料计算 | 包材计算 |
|---------|---------|---------|---------|
| 半面罩 | 主体 | (用量×单价)÷0.99 | (单价÷用量)÷1 |
| 半面罩 | 配件 | (用量×单价)÷0.99 | (单价÷用量)÷1 |
| 半面罩 | 滤毒盒 | (用量×单价)÷0.95 | (单价÷用量)÷0.97 |
| 半面罩 | 滤棉 | (单价÷用量)÷0.97 | (单价÷用量)÷1 |
| 半面罩 | 滤饼 | (单价÷用量)÷0.97 | (单价÷用量)÷1 |

## 如何修改配置

### 方法1：通过系统配置API（推荐）

管理员可以通过以下API更新计算规则：

```bash
# 获取当前配置
GET /api/config/calculation_rules

# 更新配置（需要管理员权限）
PUT /api/config/calculation_rules
Content-Type: application/json

{
  "value": {
    "半面罩": {
      "滤毒盒": {
        "material": { "formula": "multiply", "coefficient": 0.96 },
        "packaging": { "formula": "divide", "coefficient": 0.98 }
      }
    }
  }
}
```

### 方法2：通过批量更新API

```bash
POST /api/config/batch
Content-Type: application/json

{
  "configs": {
    "calculation_rules": {
      "半面罩": {
        "滤毒盒": {
          "material": { "formula": "multiply", "coefficient": 0.96 },
          "packaging": { "formula": "divide", "coefficient": 0.98 }
        }
      }
    }
  }
}
```

### 方法3：直接修改数据库

```sql
UPDATE system_config
SET config_value = '{"半面罩":{"主体":{"material":{"formula":"multiply","coefficient":0.99},...}}}',
    updated_at = NOW()
WHERE config_key = 'calculation_rules';
```

## 验证规则

系统会自动验证配置的格式：

- `formula` 必须是 `multiply` 或 `divide`
- `coefficient` 必须是正数
- 配置必须是有效的 JSON 对象

如果验证失败，API 将返回 400 错误并说明原因。

## 注意事项

1. **实时生效**：配置修改后立即生效，无需重启服务
2. **仅影响新计算**：已保存的报价单不会自动重新计算
3. **默认回退**：如果某个计算类型没有在配置中找到，将使用默认规则（divide公式，系数1）
4. **备份建议**：修改前建议备份当前配置

## 扩展支持

如需支持其他型号分类（如"全面罩"），只需在配置中添加相应的分类和计算类型：

```json
{
  "半面罩": { ... },
  "全面罩": {
    "主体": {
      "material": { "formula": "multiply", "coefficient": 0.98 },
      "packaging": { "formula": "divide", "coefficient": 1 }
    }
  }
}
```

然后在型号管理页面为全面罩型号选择相应的计算类型即可。
