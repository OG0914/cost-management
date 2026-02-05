---
name: Git Fork Workflow
description: Git Fork 工作流指南，用于开源项目协作
---

# Git Fork 工作流

## 概述
Fork 工作流是开源项目协作的标准流程，通过 Fork 仓库、开发分支、Pull Request 的方式贡献代码。

## 工作流程

### 1. Fork 仓库
```bash
# 在 GitHub 上点击 Fork 按钮，然后克隆
git clone https://github.com/YOUR_USERNAME/project.git
cd project

# 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/project.git
```

### 2. 同步上游
```bash
# 获取上游更新
git fetch upstream

# 切换到主分支
git checkout main

# 合并上游更新
git merge upstream/main

# 推送到自己的 Fork
git push origin main
```

### 3. 创建功能分支
```bash
# 基于最新 main 创建分支
git checkout -b feature/your-feature-name

# 命名规范
# feature/xxx - 新功能
# fix/xxx     - 修复
# docs/xxx    - 文档
# refactor/xxx - 重构
```

### 4. 开发提交
```bash
# 开发...

# 提交（遵循 Conventional Commits）
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue #123"
git commit -m "docs: update README"

# 推送功能分支
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request
1. 在 GitHub 上打开你的 Fork
2. 点击 "Compare & pull request"
3. 填写 PR 标题和描述
4. 请求 Review

### 6. 代码审查
```bash
# 根据 Review 反馈修改
git commit -m "fix: address review comments"
git push origin feature/your-feature-name
```

### 7. 合并完成
PR 被合并后：
```bash
# 删除本地分支
git branch -d feature/your-feature-name

# 删除远程分支
git push origin --delete feature/your-feature-name

# 同步主分支
git checkout main
git pull upstream main
git push origin main
```

## Commit 规范

### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 |
| docs | 文档 |
| style | 格式（不影响代码运行） |
| refactor | 重构 |
| test | 测试 |
| chore | 构建/工具 |

### 示例
```
feat(auth): add JWT authentication

- Implement JWT token generation
- Add token validation middleware
- Create refresh token mechanism

Closes #123
```

## 冲突解决

```bash
# 同步上游
git fetch upstream
git checkout feature/your-feature-name
git rebase upstream/main

# 解决冲突后
git add .
git rebase --continue

# 强制推送
git push origin feature/your-feature-name --force
```

## 常用命令速查

```bash
# 查看所有远程
git remote -v

# 查看分支状态
git branch -a

# 交互式 rebase（整理提交）
git rebase -i HEAD~3

# 暂存当前工作
git stash
git stash pop

# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1
```
