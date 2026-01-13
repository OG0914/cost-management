# STATE_MGMT - 状态管理

> 涉及版本控制、数据一致性、复制完整性等状态相关问题

## 相关报告

| ID | 问题 | 关键触发条件 |
|----|------|-------------|
| [PM-001](../reports/PM-001.md) | Git合并时代码被覆盖 | 合并后大量代码删除 |
| [PM-004](../reports/PM-004.md) | 删除操作缺少引用检查 | destroy()无前置检查 |
| [PM-009](../reports/PM-009.md) | 复制功能数据丢失 | 浅拷贝丢失关联数据 |

## 典型触发模式

```yaml
patterns:
  # 直接删除操作
  - regex: "\\.destroy\\(\\)|DELETE FROM(?!.*WHERE.*=.*null)"
  
  # 浅拷贝风险
  - regex: "JSON\\.parse\\(JSON\\.stringify|Object\\.assign\\(\\{\\}|\\.\\.\\."
  
  # 合并覆盖标志
  - keywords: ["恢复", "restore", "revert", "被覆盖", "merge conflict"]
```

## 预防要点

1. **删除检查**: 所有删除接口必须先检查外键引用
2. **软删除**: 历史记录类数据使用 `deleted_at` 软删除
3. **复制完整性**: 复制功能必须列出完整字段清单并逐一验证
4. **合并流程**: 
   - 合并前执行 `git diff origin/main`
   - 大量删除行数的 commit 需人工复核
   - 合并后运行功能回归测试
