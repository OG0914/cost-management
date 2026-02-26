#!/bin/bash
# PostgreSQL 数据库恢复脚本
# 用法: bash restore.sh <备份文件路径> [--docker 容器名]
# 示例: bash restore.sh /data/backups/postgresql/cost_analysis_20260226.dump --docker cost-postgres
# ⚠️ 注意: 恢复会覆盖目标数据库的所有数据！请确认后再操作。

set -euo pipefail

# ========== 配置区 ==========
DB_NAME="${DB_NAME:-cost_analysis}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DOCKER_CONTAINER=""
LOG_PREFIX="[恢复]"

# ========== 参数解析 ==========
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --docker) DOCKER_CONTAINER="$2"; shift 2 ;;
        --db)     DB_NAME="$2"; shift 2 ;;
        --help)
            echo "用法: bash restore.sh <备份文件> [选项]"
            echo "  <备份文件>           .dump 备份文件的完整路径"
            echo "  --docker <容器名>    Docker模式，指定PostgreSQL容器名"
            echo "  --db <数据库名>      目标数据库名（默认cost_analysis）"
            echo ""
            echo "⚠️  恢复操作会覆盖目标数据库的所有现有数据！"
            exit 0
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$1"
            else
                echo "${LOG_PREFIX} 未知参数: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# ========== 前置检查 ==========
if [ -z "$BACKUP_FILE" ]; then
    echo "${LOG_PREFIX} ❌ 错误: 请指定备份文件路径"
    echo "用法: bash restore.sh <备份文件> [--docker 容器名]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "${LOG_PREFIX} ❌ 错误: 备份文件不存在: ${BACKUP_FILE}"
    exit 1
fi

FILE_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null || echo "0")
FILE_SIZE_KB=$((FILE_SIZE / 1024))

echo "${LOG_PREFIX} =========================================="
echo "${LOG_PREFIX} 数据库恢复操作"
echo "${LOG_PREFIX} 备份文件: ${BACKUP_FILE} (${FILE_SIZE_KB} KB)"
echo "${LOG_PREFIX} 目标数据库: ${DB_NAME}"
echo "${LOG_PREFIX} 模式: $([ -n "$DOCKER_CONTAINER" ] && echo "Docker (${DOCKER_CONTAINER})" || echo "原生")"
echo "${LOG_PREFIX} =========================================="
echo ""
echo "⚠️  警告: 此操作将覆盖 ${DB_NAME} 数据库的所有数据！"
echo ""
read -p "确认恢复? 请输入 YES 继续: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "${LOG_PREFIX} 操作已取消"
    exit 0
fi

# ========== 恢复前备份（安全网） ==========
echo "${LOG_PREFIX} 正在创建当前数据的安全备份..."
SAFETY_DIR=$(dirname "${BACKUP_FILE}")
SAFETY_FILE="${SAFETY_DIR}/cost_analysis_pre_restore_$(date +%Y%m%d_%H%M%S).dump"

if [ -n "$DOCKER_CONTAINER" ]; then
    docker exec "${DOCKER_CONTAINER}" pg_dump \
        -U "${DB_USER}" -Fc "${DB_NAME}" > "${SAFETY_FILE}" 2>/dev/null || true
else
    PGPASSWORD="${PGPASSWORD:-}" pg_dump \
        -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" \
        -Fc "${DB_NAME}" > "${SAFETY_FILE}" 2>/dev/null || true
fi

SAFETY_SIZE=$(stat -c%s "${SAFETY_FILE}" 2>/dev/null || stat -f%z "${SAFETY_FILE}" 2>/dev/null || echo "0")
if [ "${SAFETY_SIZE}" -gt 1024 ]; then
    echo "${LOG_PREFIX} ✅ 安全备份已创建: ${SAFETY_FILE}"
else
    echo "${LOG_PREFIX} ⚠️  安全备份跳过（数据库可能为空或不存在）"
    rm -f "${SAFETY_FILE}"
fi

# ========== 执行恢复 ==========
echo "${LOG_PREFIX} 正在恢复数据库..."

if [ -n "$DOCKER_CONTAINER" ]; then
    # 先删除再重建数据库（确保干净状态）
    docker exec "${DOCKER_CONTAINER}" psql -U "${DB_USER}" -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" \
        postgres 2>/dev/null || true

    docker exec "${DOCKER_CONTAINER}" dropdb -U "${DB_USER}" --if-exists "${DB_NAME}"
    docker exec "${DOCKER_CONTAINER}" createdb -U "${DB_USER}" "${DB_NAME}"

    # 恢复数据
    cat "${BACKUP_FILE}" | docker exec -i "${DOCKER_CONTAINER}" pg_restore \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --no-owner \
        --no-privileges \
        --single-transaction 2>/dev/null || true
else
    PGPASSWORD="${PGPASSWORD:-}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" \
        postgres 2>/dev/null || true

    PGPASSWORD="${PGPASSWORD:-}" dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --if-exists "${DB_NAME}"
    PGPASSWORD="${PGPASSWORD:-}" createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"

    PGPASSWORD="${PGPASSWORD:-}" pg_restore \
        -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --no-owner \
        --no-privileges \
        --single-transaction \
        "${BACKUP_FILE}" 2>/dev/null || true
fi

# ========== 验证恢复 ==========
echo "${LOG_PREFIX} 正在验证恢复结果..."

if [ -n "$DOCKER_CONTAINER" ]; then
    TABLE_COUNT=$(docker exec "${DOCKER_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
    USER_COUNT=$(docker exec "${DOCKER_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
        "SELECT count(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
else
    TABLE_COUNT=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c \
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
    USER_COUNT=$(PGPASSWORD="${PGPASSWORD:-}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c \
        "SELECT count(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
fi

echo "${LOG_PREFIX} =========================================="
echo "${LOG_PREFIX} ✅ 恢复完成！"
echo "${LOG_PREFIX} 📊 表数量: ${TABLE_COUNT}"
echo "${LOG_PREFIX} 👤 用户数: ${USER_COUNT}"
if [ "${SAFETY_SIZE}" -gt 1024 ]; then
    echo "${LOG_PREFIX} 🔙 如需回滚，使用安全备份: ${SAFETY_FILE}"
fi
echo "${LOG_PREFIX} =========================================="
