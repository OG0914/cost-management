---
name: git-fork-workflow
description: Fork仓库工作流。克隆fork仓库、设置上游、同步代码、创建PR等操作时使用。
---

# Git Fork 工作流

## 概述

管理 fork 仓库与上游仓库的完整工作流程。

## 初始设置

### 克隆 Fork 仓库

```bash
git clone https://github.com/<你的用户名>/<仓库名>.git
cd <仓库名>
```

### 添加上游仓库

```bash
git remote add upstream https://github.com/<原作者>/<仓库名>.git
git remote -v  # 验证
```

## 日常操作

### 同步上游代码

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### 创建功能分支

```bash
git checkout -b feature-name
# 开发...
git add .
git commit -m "feat: 描述"
git push origin feature-name
```

### 解决冲突

```bash
git fetch upstream
git merge upstream/main
# 手动解决冲突文件中的 <<<<<<< ======= >>>>>>>
git add .
git commit -m "merge: resolve conflicts with upstream"
git push origin <分支名>
```

### 使用 Rebase 同步（保持提交历史整洁）

```bash
git fetch upstream
git rebase upstream/main
# 解决冲突后
git add .
git rebase --continue
git push origin <分支名> --force
```

## 创建 Pull Request

1. 推送分支到 fork: `git push origin <分支名>`
2. 访问 GitHub fork 仓库页面
3. 点击 "Compare & pull request"
4. 选择:
   - base repository: 上游仓库
   - base: main
   - head repository: 你的 fork
   - compare: 你的分支
5. 填写标题和描述
6. 点击 "Create pull request"

## PR 被合并后清理

```bash
git checkout main
git pull upstream main
git push origin main
git branch -d feature-name
git push origin --delete feature-name
```

## 上游仓库处理 PR

1. 进入仓库 → Pull requests
2. 点击 PR 查看详情
3. Files changed 查看代码修改
4. Review changes → Approve/Request changes
5. Merge pull request → 选择合并方式
6. Confirm merge

## Windows PowerShell 注意

```bash
# 使用 git -C 格式避免 && 解析问题
git -C "D:\path\to\repo" fetch upstream
git -C "D:\path\to\repo" merge upstream/main
```

## 常用命令速查

| 操作 | 命令 |
|------|------|
| 查看远程 | `git remote -v` |
| 获取上游 | `git fetch upstream` |
| 合并上游 | `git merge upstream/main` |
| 变基上游 | `git rebase upstream/main` |
| 推送分支 | `git push origin <branch>` |
| 强制推送 | `git push origin <branch> --force` |
| 删除本地分支 | `git branch -d <branch>` |
| 删除远程分支 | `git push origin --delete <branch>` |
