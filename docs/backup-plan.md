# 📦 数据库备份与恢复计划

> 最后更新: 2026-02-26
> 运行环境: Windows 10 + Docker Desktop + PostgreSQL
> 容器名称: cost-postgres
> 备份目录: G:\cost_backup

---

## 一、备份策略概览

| 项目 | 配置 |
|------|------|
| 数据库 | PostgreSQL（Docker 容器 `cost-postgres`） |
| 数据库名 | `cost_analysis` |
| 备份工具 | `pg_dump`（通过 docker exec 调用） |
| 备份格式 | 自定义归档格式 `.dump` |
| 备份频率 | 每日凌晨 2:00 自动备份 |
| 保留策略 | 最近 30 天 |
| 存储位置 | `G:\cost_backup\` |
| 日志位置 | `G:\cost_backup\backup.log` |

---

## 二、脚本清单

```
scripts/backup/
├── backup.ps1          # 每日自动备份（PowerShell）
├── restore.ps1         # 从备份恢复（PowerShell）
├── setup-schedule.ps1  # 一键注册 Windows 定时任务
├── backup.sh           # Linux 版备份（备用）
├── restore.sh          # Linux 版恢复（备用）
└── migrate-storage.sh  # 存储迁移（备用）
```

---

## 三、首次配置（只需做一次）

### 第1步：手动测试备份是否正常

打开 **PowerShell**，运行：

```powershell
powershell -ExecutionPolicy Bypass -File "E:\desktop\cost-management\scripts\backup\backup.ps1"
```

如果看到 `✅ 备份成功` 和文件大小，说明一切正常。

### 第2步：注册自动定时任务

**以管理员身份**打开 PowerShell（右键 → 以管理员身份运行），运行：

```powershell
powershell -ExecutionPolicy Bypass -File "E:\desktop\cost-management\scripts\backup\setup-schedule.ps1"
```

注册成功后，系统会在每天凌晨 2:00 自动执行备份——**不管是否登录 Windows 都会执行**。

### 第3步：验证任务已注册

打开"任务计划程序"（搜索栏搜 `任务计划`），在任务列表中找到 `CostManagement-DB-Backup`。

或者在 PowerShell 中运行：
```powershell
Get-ScheduledTask -TaskName "CostManagement-DB-Backup"
```

---

## 四、日常使用

### 4.1 手动备份

```powershell
# 使用默认配置（容器: cost-postgres，目录: G:\cost_backup）
powershell -ExecutionPolicy Bypass -File "E:\desktop\cost-management\scripts\backup\backup.ps1"

# 自定义参数
powershell -ExecutionPolicy Bypass -File "E:\desktop\cost-management\scripts\backup\backup.ps1" -KeepDays 60
```

### 4.2 查看备份文件

```powershell
# 列出所有备份
dir G:\cost_backup\*.dump

# 查看备份日志
Get-Content G:\cost_backup\backup.log -Tail 30
```

### 4.3 手动触发定时任务

```powershell
Start-ScheduledTask -TaskName "CostManagement-DB-Backup"
```

---

## 五、从备份恢复

### 5.1 什么时候需要恢复？

- 误删了重要数据（比如不小心删了客户或报价单）
- 数据库损坏
- 迁移到新服务器后导入数据

### 5.2 恢复步骤

```powershell
# 第1步：查看可用的备份文件
dir G:\cost_backup\*.dump

# 第2步：执行恢复
powershell -ExecutionPolicy Bypass -File "E:\desktop\cost-management\scripts\backup\restore.ps1" -BackupFile "G:\cost_backup\cost_analysis_20260226_020000.dump"

# 第3步：系统会要求输入 YES 确认
# 第4步：恢复前自动创建安全备份（防止误操作）
# 第5步：恢复完成后自动验证表数量和用户数
```

### 5.3 安全机制

恢复脚本有**双重保护**：

1. **确认提示**：必须手动输入 `YES`
2. **自动安全备份**：恢复前先保存当前数据到 `cost_analysis_pre_restore_xxx.dump`，万一恢复错了还能再回滚

---

## 六、存储迁移（换更大磁盘）

当 G 盘空间不足或想换到其他存储时：

### 方法一：简单方式（推荐）

```powershell
# 1. 先做一次手动备份
powershell -ExecutionPolicy Bypass -File "E:\desktop\cost-management\scripts\backup\backup.ps1"

# 2. 复制备份文件到新磁盘
copy G:\cost_backup\最新的备份.dump H:\新路径\

# 3. 修改 backup.ps1 中的 BackupDir 默认值，或运行时指定
#    -BackupDir "H:\新路径"

# 4. 重新注册定时任务（如果改了脚本路径）
```

### 方法二：整库迁移到新 Docker 容器

```powershell
# 1. 备份当前数据
docker exec cost-postgres pg_dump -U postgres -Fc cost_analysis > G:\cost_backup\migration.dump

# 2. 停止旧容器
docker stop cost-postgres

# 3. 启动新容器（挂载到新磁盘）
docker run -d --name cost-postgres-new -v H:\pg_data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=你的密码 -e TZ=Asia/Shanghai -p 5432:5432 --restart unless-stopped postgres:16

# 4. 等待新容器就绪（约10秒）
Start-Sleep -Seconds 10

# 5. 恢复数据
Get-Content G:\cost_backup\migration.dump -Raw -Encoding Byte | docker exec -i cost-postgres-new pg_restore -U postgres -d cost_analysis --no-owner --no-privileges

# 6. 验证正常后，删除旧容器
docker rm cost-postgres
docker rename cost-postgres-new cost-postgres
```

---

## 七、容量预估

| 数据类型 | 单条大小 | 年预估量 | 年增长 |
|----------|----------|----------|--------|
| 报价单 | ~2 KB | 1000条 | ~2 MB |
| 报价明细 | ~0.5 KB | 30,000条 | ~15 MB |
| 原料数据 | ~0.3 KB | 500条 | ~0.15 MB |
| 系统日志 | ~0.5 KB | 100,000条 | ~50 MB |
| 文件上传 | ~50 KB | 200个 | ~10 MB |
| **合计** | | | **~80 MB/年** |

> 10 年使用量约 1 GB。G 盘只要有几 GB 空间就完全够用。

---

## 八、应急操作手册

### 场景1：数据库连接失败

```powershell
# 检查容器状态
docker ps -a | findstr postgres

# 重启容器
docker start cost-postgres

# 查看容器日志
docker logs --tail 50 cost-postgres
```

### 场景2：误删了数据

```powershell
# 找到最近的备份
dir G:\cost_backup\*.dump | Sort-Object LastWriteTime -Descending | Select-Object -First 5

# 恢复
powershell -ExecutionPolicy Bypass -File "E:\desktop\cost-management\scripts\backup\restore.ps1" -BackupFile "G:\cost_backup\最近的备份.dump"
```

### 场景3：Docker Desktop 未自动启动

确保 Docker Desktop 设置了开机自启：
- 打开 Docker Desktop → Settings → General
- 勾选 **Start Docker Desktop when you sign in**

### 场景4：定时任务没执行

```powershell
# 检查任务状态
Get-ScheduledTask -TaskName "CostManagement-DB-Backup" | Select-Object State, LastRunTime, LastTaskResult

# 查看最近运行结果（0 = 成功）
Get-ScheduledTaskInfo -TaskName "CostManagement-DB-Backup"

# 手动触发测试
Start-ScheduledTask -TaskName "CostManagement-DB-Backup"
```

---

## 九、每月检查清单

- [ ] 确认 `G:\cost_backup\` 下有最近 7 天的 `.dump` 文件
- [ ] 确认 `G:\cost_backup\backup.log` 最近日志无报错
- [ ] 确认定时任务状态为"就绪"：`Get-ScheduledTask -TaskName "CostManagement-DB-Backup"`
- [ ] 确认 G 盘剩余空间充足：`Get-PSDrive G`
- [ ] （可选）测试恢复一次，确认备份数据可用
