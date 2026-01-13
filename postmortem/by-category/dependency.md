# DEPENDENCY - 依赖问题

> 涉及安全漏洞、版本管理等依赖相关问题

## 相关报告

| ID | 问题 | 关键触发条件 |
|----|------|-------------|
| [PM-008](../reports/PM-008.md) | xlsx包高危漏洞 | 使用已知漏洞的npm包 |

## 典型触发模式

```yaml
patterns:
  # xlsx 漏洞包
  - regex: "\"xlsx\":\\s*\"[^\"]+\""
  
  # 引入可疑包
  - regex: "require\\(['\"]xlsx['\"]\\)|from ['\"]xlsx['\"]"
```

## 已知风险包

| 包名 | 风险 | 替代方案 |
|------|------|---------|
| xlsx | RCE漏洞 | exceljs |
| event-stream | 恶意代码 | 移除或固定版本 |
| lodash < 4.17.21 | 原型污染 | 升级版本 |

## 预防要点

1. **定期审计**: 每周执行 `npm audit`
2. **CI集成**: 添加安全扫描到 CI/CD（如 Snyk、Dependabot）
3. **新增依赖**: 检查 npm 安全评级和维护状态
4. **响应时效**: 高危漏洞 24h 内修复
5. **锁定版本**: 生产环境使用 `package-lock.json` 锁定

## 安全检查命令

```bash
# 检查漏洞
npm audit

# 自动修复低风险漏洞
npm audit fix

# 查看过时包
npm outdated
```
