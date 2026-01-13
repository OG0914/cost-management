# LOGIC - 逻辑错误

> 涉及计算公式、UI逻辑、配置验证等逻辑相关问题

## 相关报告

| ID | 问题 | 关键触发条件 |
|----|------|-------------|
| [PM-002](../reports/PM-002.md) | 图片预览层级问题 | el-image缺少preview-teleported |
| [PM-005](../reports/PM-005.md) | 利润区间计算错误 | 前后端计算不一致 |
| [PM-007](../reports/PM-007.md) | 增值税计算逻辑错误 | 税率使用input而非select |

## 典型触发模式

```yaml
patterns:
  # 图片预览层级
  - regex: "<el-image[^>]*(?!preview-teleported)[^>]*preview"
  
  # 税率/费率输入
  - regex: "vat.*input|tax.*input|<el-input.*税"
  
  # 百分比转换
  - regex: "\\*\\s*100|\\*\\s*0\\.\\d+|/\\s*100"
  
  # 利润计算
  - regex: "profit.*margin|利润.*区间|毛利.*计算"
```

## 预防要点

1. **UI组件**: el-image 预览必须添加 `preview-teleported`
2. **固定选项**: 税率、费率等使用下拉选择，禁止自由输入
3. **计算统一**: 业务计算公式统一在后端实现，前端只显示
4. **百分比格式**: 统一使用小数存储（0.13 而非 13）
