# PRECISION - 精度问题

> 涉及数值计算、类型转换、系数应用等精度相关问题

## 相关报告

| ID | 问题 | 关键触发条件 |
|----|------|-------------|
| [PM-003](../reports/PM-003.md) | BOM数据类型转换错误 | TEXT类型存储数值 |
| [PM-006](../reports/PM-006.md) | 工价系数重复计算 | 系数在多处应用 |

## 典型触发模式

```yaml
patterns:
  # 数值字段使用TEXT类型
  - regex: "type:\\s*DataTypes\\.TEXT.*(?:amount|price|cost|quantity)"
  
  # 系数乘法操作
  - regex: "\\*\\s*1\\.56|\\*\\s*coefficient|系数.*\\*"
  
  # 频繁类型转换
  - regex: "parseFloat|parseInt|Number\\("
```

## 预防要点

1. **数值字段类型**: 金额/数量字段使用 DECIMAL 或在 getter 中转换
2. **系数应用**: 系数只在一处（推荐后端）应用，禁止重复
3. **类型一致性**: 模型层统一处理类型转换，前端不做二次转换
4. **测试覆盖**: 数值计算必须有单元测试覆盖边界值
