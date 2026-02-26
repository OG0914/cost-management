#!/bin/bash
# PostgreSQL 数据库自动备份脚本
# 用法: bash backup.sh [--docker 容器名] [--keep 保留天数]
# 示例: bash backup.sh --docker cost-postgres --keep 30
# 定时: crontab -e → 0 2 * * * /path/to/backup.sh --docker cost-postgres >> /var/log/db-backup.log 2>&1

set -euo pipefail

# ========== 配置区（可根据实际环境修改） ==========
BACKUP_DIR="${BACKUP_DIR:-/data/backups/postgresql}"  # 备份存储目录
DB_NAME="${DB_NAME:-cost_analysis}"                    # 数据库名称
DB_USER="${DB_USER:-postgres}"                         # 数据库用户
DB_HOST="${DB_HOST:-localhost}"                         # 数据库地址（原生模式用）
DB_PORT="${DB_PORT:-5432}"                              # 数据库端口（原生模式用）
KEEP_DAYS=7                                            # 默认保留最近7天备份
DOCKER_CONTAINER=""                                    # Docker容器名（留空=原生模式）
TIMESTAMP=$(date +%Y%m%d_%H%M%S)                       # 时间戳
BACKUP_FILE="${BACKUP_DIR}/cost_analysis_${TIMESTAMP}.dump"
LOG_PREFIX="[备份]"

# ========== 参数解析 ==========
while [[ $# -gt 0 ]]; do
    case "$1" in
        --docker) DOCKER_CONTAINER="$2"; shift 2 ;;
        --keep)   KEEP_DAYS="$2"; shift 2 ;;
        --dir)    BACKUP_DIR="$2"; BACKUP_FILE="${BACKUP_DIR}/cost_analysis_${TIMESTAMP}.dump"; shift 2 ;;
        --db)     DB_NAME="$2"; shift 2 ;;
        --help)
            echo "用法: bash backup.sh [选项]"
            echo "  --docker <容器名>   Docker模式，指定PostgreSQL容器名"
            echo "  --keep <天数>       保留最近N天的备份（默认7天）"
            echo "  --dir <目录>        备份存储目录（默认/data/backups/postgresql）"
            echo "  --db <数据库名>     数据库名称（默认cost_analysis）"
            exit 0
            ;;
        *) echo "${LOG_PREFIX} 未知参数: $1"; exit 1 ;;
    esac
done

# ========== 前置检查 ==========
echo "${LOG_PREFIX} =========================================="
echo "${LOG_PREFIX} 开始备份 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "${LOG_PREFIX} 数据库: ${DB_NAME}"
echo "${LOG_PREFIX} 模式: $([ -n "$DOCKER_CONTAINER" ] && echo "Docker (${DOCKER_CONTAINER})" || echo "原生")"

mkdir -p "${BACKUP_DIR}" # 确保备份目录存在

# ========== 执行备份 ==========
echo "${LOG_PREFIX} 正在导出数据库..."

if [ -n "$DOCKER_CONTAINER" ]; then
    # Docker 模式：通过 docker exec 执行 pg_dump
    if ! docker ps --format '{{.Names}}' | grep -q "^${DOCKER_CONTAINER}$"; then
        echo "${LOG_PREFIX} ❌ 错误: 容器 '${DOCKER_CONTAINER}' 未运行"
        exit 1
    fi
    docker exec "${DOCKER_CONTAINER}" pg_dump \
        -U "${DB_USER}" \
        -Fc \
        --no-owner \
        --no-privileges \
        "${DB_NAME}" > "${BACKUP_FILE}"
else
    # 原生模式：直接调用 pg_dump
    if ! command -v pg_dump &> /dev/null; then
        echo "${LOG_PREFIX} ❌ 错误: pg_dump 命令不存在，请安装 PostgreSQL 客户端工具"
        exit 1
    fi
    PGPASSWORD="${PGPASSWORD:-}" pg_dump \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -Fc \
        --no-owner \
        --no-privileges \
        "${DB_NAME}" > "${BACKUP_FILE}"
fi

# ========== 验证备份 ==========
BACKUP_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null || echo "0")

if [ "${BACKUP_SIZE}" -lt 1024 ]; then
    echo "${LOG_PREFIX} ❌ 备份文件异常（${BACKUP_SIZE} 字节），可能备份失败"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

BACKUP_SIZE_KB=$((BACKUP_SIZE / 1024))
echo "${LOG_PREFIX} ✅ 备份成功: ${BACKUP_FILE} (${BACKUP_SIZE_KB} KB)"

# ========== 清理过期备份 ==========
DELETED_COUNT=0
while IFS= read -r old_file; do
    rm -f "${old_file}"
    DELETED_COUNT=$((DELETED_COUNT + 1))
done < <(find "${BACKUP_DIR}" -name "cost_analysis_*.dump" -type f -mtime +${KEEP_DAYS} 2>/dev/null)

if [ "${DELETED_COUNT}" -gt 0 ]; then
    echo "${LOG_PREFIX} 🗑️  已清理 ${DELETED_COUNT} 个超过 ${KEEP_DAYS} 天的旧备份"
fi

# ========== 统计信息 ==========
TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -name "cost_analysis_*.dump" -type f 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
echo "${LOG_PREFIX} 📊 当前共 ${TOTAL_BACKUPS} 个备份，总占用 ${TOTAL_SIZE}"
echo "${LOG_PREFIX} 备份完成 - $(date '+%Y-%m-%d %H:%M:%S')"
echo "${LOG_PREFIX} =========================================="
