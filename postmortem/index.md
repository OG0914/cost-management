# Postmortem 知识库索引

> 最后更新: 2026-01-13
> 项目: cost-analysis (成本分析系统)

## 统计概览

| 指标 | 数值 |
|------|------|
| 总报告数 | 9 |
| 分析 Commits | 15+ |
| 根因类别 | 4 |

## 按根因类别分布

| 类别 | 数量 | 报告 |
|------|------|------|
| **STATE_MGMT** (状态管理) | 3 | PM-001, PM-004, PM-009 |
| **LOGIC** (逻辑错误) | 3 | PM-002, PM-005, PM-007 |
| **PRECISION** (精度问题) | 2 | PM-003, PM-006 |
| **DEPENDENCY** (依赖问题) | 1 | PM-008 |

## 报告列表

| ID | 问题描述 | 类别 | 修复Commit |
|----|---------|------|-----------|
| [PM-001](reports/PM-001.md) | Git合并时代码被覆盖 | STATE_MGMT | da1bec4, c099cb4, 44bc5c9 |
| [PM-002](reports/PM-002.md) | 图片预览层级(z-index)问题 | LOGIC | 40bf90c |
| [PM-003](reports/PM-003.md) | BOM数据类型转换错误 | PRECISION | 332c50c |
| [PM-004](reports/PM-004.md) | 删除操作缺少引用检查 | STATE_MGMT | 750549b, 3bdf2ec |
| [PM-005](reports/PM-005.md) | 利润区间计算错误 | LOGIC | 95f7ffd |
| [PM-006](reports/PM-006.md) | 工价系数重复乘以1.56 | PRECISION | d4fc2b8 |
| [PM-007](reports/PM-007.md) | 增值税计算逻辑错误 | LOGIC | b3753de |
| [PM-008](reports/PM-008.md) | 依赖包高危漏洞(xlsx) | DEPENDENCY | 64c1999 |
| [PM-009](reports/PM-009.md) | 复制报价单时包材明细名称丢失 | STATE_MGMT | 40e3213 |

## 高风险触发条件速查

### 🔴 精度问题 (PRECISION)
```yaml
# 数值类型定义不当
- regex: "type:\\s*DataTypes\\.TEXT.*(?:amount|price|cost|quantity)"
# 系数重复应用
- regex: "\\*\\s*1\\.56|\\*\\s*coefficient"
```

### 🟡 逻辑错误 (LOGIC)
```yaml
# 图片预览层级
- regex: "<el-image[^>]*(?!preview-teleported)[^>]*preview"
# 税率输入验证
- regex: "vat.*input|tax.*input"
# 百分比转换
- regex: "\\*\\s*100|/\\s*100"
```

### 🟠 状态管理 (STATE_MGMT)
```yaml
# 删除前检查
- regex: "\\.destroy\\(\\)|DELETE FROM(?!.*WHERE)"
# 浅拷贝风险
- regex: "JSON\\.parse\\(JSON\\.stringify"
# 合并覆盖
- keywords: ["恢复", "restore", "被覆盖"]
```

### ⚫ 依赖问题 (DEPENDENCY)
```yaml
# xlsx 漏洞包
- regex: "\"xlsx\":|require\\(['\"]xlsx['\"]\\)"
```

## 使用方法

### Pre-Release 检查
```bash
# 1. 获取待发布的 diff
git diff origin/main > pending_release.diff

# 2. 对照 triggers.yaml 检查风险
# 使用 grep 或 AI 语义分析匹配触发条件
```

### Post-Release 更新
```bash
# 1. 获取新的 fix commits
git log --oneline --grep="fix" HEAD~10..HEAD

# 2. 为每个 fix 生成 postmortem
# 3. 更新 triggers.yaml 和本索引
```

## 相关文件

- [triggers.yaml](triggers.yaml) - 机器可读的触发条件
- [reports/](reports/) - 详细报告目录

---

> 💡 **铁律**: 没有触发条件的尸检报告 = 无效报告
