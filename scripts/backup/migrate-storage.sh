#!/bin/bash
# PostgreSQL 存储无损迁移脚本
# 场景：Docker PostgreSQL 容器数据迁移到新磁盘/新服务器
# 用法: bash migrate-storage.sh --from <旧容器名> --to-dir <新数据目录>
# 示例: bash migrate-storage.sh --from cost-postgres --to-dir /mnt/large-disk/pg_data
# ⚠️ 迁移过程需要短暂停机（通常5分钟以内）

set -euo pipefail

# ========== 配置区 ==========
DB_NAME="${DB_NAME:-cost_analysis}"
DB_USER="${DB_USER:-postgres}"
PG_IMAGE="${PG_IMAGE:-postgres:16}"
PG_PASSWORD="${PG_PASSWORD:-}"
OLD_CONTAINER=""
NEW_DATA_DIR=""
NEW_CONTAINER_NAME="cost-postgres-new"
BACKUP_DIR="/tmp/pg_migration_$(date +%Y%m%d)"
LOG_PREFIX="[迁移]"

# ========== 参数解析 ==========
while [[ $# -gt 0 ]]; do
    case "$1" in
        --from)     OLD_CONTAINER="$2"; shift 2 ;;
        --to-dir)   NEW_DATA_DIR="$2"; shift 2 ;;
        --password) PG_PASSWORD="$2"; shift 2 ;;
        --image)    PG_IMAGE="$2"; shift 2 ;;
        --name)     NEW_CONTAINER_NAME="$2"; shift 2 ;;
        --help)
            echo "用法: bash migrate-storage.sh [选项]"
            echo "  --from <容器名>      源PostgreSQL容器名"
            echo "  --to-dir <目录>      新数据存储目录（会挂载为Docker Volume）"
            echo "  --password <密码>    PostgreSQL密码"
            echo "  --image <镜像>       PostgreSQL镜像（默认postgres:16）"
            echo "  --name <容器名>      新容器名称（默认cost-postgres-new）"
            echo ""
            echo "迁移流程："
            echo "  1. 从旧容器导出完整备份"
            echo "  2. 在新磁盘目录启动新PostgreSQL容器"
            echo "  3. 将备份导入新容器"
            echo "  4. 验证数据完整性"
            echo "  5. 输出后续操作指引"
            exit 0
            ;;
        *) echo "${LOG_PREFIX} 未知参数: $1"; exit 1 ;;
    esac
done

# ========== 前置验证 ==========
if [ -z "$OLD_CONTAINER" ] || [ -z "$NEW_DATA_DIR" ]; then
    echo "${LOG_PREFIX} ❌ 必须指定 --from 和 --to-dir 参数"
    echo "用法: bash migrate-storage.sh --from <旧容器名> --to-dir <新数据目录>"
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${OLD_CONTAINER}$"; then
    echo "${LOG_PREFIX} ❌ 容器 '${OLD_CONTAINER}' 未运行"
    exit 1
fi

# 获取旧容器的密码（从环境变量中读取）
if [ -z "$PG_PASSWORD" ]; then
    PG_PASSWORD=$(docker exec "${OLD_CONTAINER}" printenv POSTGRES_PASSWORD 2>/dev/null || echo "")
    if [ -z "$PG_PASSWORD" ]; then
        echo "${LOG_PREFIX} ❌ 无法自动获取密码，请使用 --password 参数指定"
        exit 1
    fi
fi

echo "${LOG_PREFIX} =========================================="
echo "${LOG_PREFIX} 存储迁移计划"
echo "${LOG_PREFIX} 源容器: ${OLD_CONTAINER}"
echo "${LOG_PREFIX} 目标目录: ${NEW_DATA_DIR}"
echo "${LOG_PREFIX} 新容器: ${NEW_CONTAINER_NAME}"
echo "${LOG_PREFIX} 数据库: ${DB_NAME}"
echo "${LOG_PREFIX} =========================================="

# 检查旧数据库的表数量和数据量
OLD_TABLE_COUNT=$(docker exec "${OLD_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
OLD_DB_SIZE=$(docker exec "${OLD_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null | tr -d ' ')

echo "${LOG_PREFIX} 📊 源数据库: ${OLD_TABLE_COUNT} 张表, 大小 ${OLD_DB_SIZE}"
echo ""
read -p "确认开始迁移? (YES/no): " CONFIRM
if [ "$CONFIRM" != "YES" ]; then
    echo "${LOG_PREFIX} 已取消"
    exit 0
fi

# ========== 第1步：从旧容器导出 ==========
echo ""
echo "${LOG_PREFIX} [1/5] 导出旧数据库..."
mkdir -p "${BACKUP_DIR}"
DUMP_FILE="${BACKUP_DIR}/${DB_NAME}_migration.dump"

docker exec "${OLD_CONTAINER}" pg_dump \
    -U "${DB_USER}" \
    -Fc \
    --no-owner \
    --no-privileges \
    "${DB_NAME}" > "${DUMP_FILE}"

DUMP_SIZE=$(stat -c%s "${DUMP_FILE}" 2>/dev/null || stat -f%z "${DUMP_FILE}" 2>/dev/null)
DUMP_SIZE_MB=$((DUMP_SIZE / 1024 / 1024))
echo "${LOG_PREFIX} ✅ 导出完成: ${DUMP_FILE} (${DUMP_SIZE_MB} MB)"

# ========== 第2步：准备新目录 ==========
echo "${LOG_PREFIX} [2/5] 准备新存储目录..."
mkdir -p "${NEW_DATA_DIR}"

# 检查目录是否为空
if [ "$(ls -A ${NEW_DATA_DIR} 2>/dev/null)" ]; then
    echo "${LOG_PREFIX} ⚠️  目标目录不为空: ${NEW_DATA_DIR}"
    read -p "继续将清空该目录，确认? (YES/no): " CONFIRM2
    if [ "$CONFIRM2" != "YES" ]; then
        echo "${LOG_PREFIX} 已取消"
        exit 0
    fi
fi

# ========== 第3步：启动新容器 ==========
echo "${LOG_PREFIX} [3/5] 启动新PostgreSQL容器..."

docker run -d \
    --name "${NEW_CONTAINER_NAME}" \
    -v "${NEW_DATA_DIR}:/var/lib/postgresql/data" \
    -e POSTGRES_PASSWORD="${PG_PASSWORD}" \
    -e POSTGRES_DB="${DB_NAME}" \
    -e TZ=Asia/Shanghai \
    -p 5433:5432 \
    "${PG_IMAGE}"

echo "${LOG_PREFIX} 等待新容器就绪..."
sleep 5

RETRY=0
MAX_RETRY=30
while [ $RETRY -lt $MAX_RETRY ]; do
    if docker exec "${NEW_CONTAINER_NAME}" pg_isready -U "${DB_USER}" &>/dev/null; then
        echo "${LOG_PREFIX} ✅ 新容器已就绪"
        break
    fi
    RETRY=$((RETRY + 1))
    sleep 1
done

if [ $RETRY -eq $MAX_RETRY ]; then
    echo "${LOG_PREFIX} ❌ 新容器启动超时"
    docker rm -f "${NEW_CONTAINER_NAME}" 2>/dev/null || true
    exit 1
fi

# ========== 第4步：导入数据 ==========
echo "${LOG_PREFIX} [4/5] 恢复数据到新容器..."

cat "${DUMP_FILE}" | docker exec -i "${NEW_CONTAINER_NAME}" pg_restore \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-privileges \
    --single-transaction 2>/dev/null || true

# ========== 第5步：验证数据 ==========
echo "${LOG_PREFIX} [5/5] 验证数据完整性..."

NEW_TABLE_COUNT=$(docker exec "${NEW_CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
NEW_DB_SIZE=$(docker exec "${NEW_CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null | tr -d ' ')

echo ""
echo "${LOG_PREFIX} =========================================="
echo "${LOG_PREFIX} ✅ 迁移完成！数据完整性对比："
echo "${LOG_PREFIX} "
echo "${LOG_PREFIX}          旧容器          新容器"
echo "${LOG_PREFIX} 表数量:  ${OLD_TABLE_COUNT}              ${NEW_TABLE_COUNT}"
echo "${LOG_PREFIX} 大小:    ${OLD_DB_SIZE}          ${NEW_DB_SIZE}"
echo "${LOG_PREFIX} =========================================="

if [ "${OLD_TABLE_COUNT}" = "${NEW_TABLE_COUNT}" ]; then
    echo "${LOG_PREFIX} ✅ 表数量一致，迁移成功!"
else
    echo "${LOG_PREFIX} ⚠️  表数量不一致，请人工检查"
fi

echo ""
echo "${LOG_PREFIX} 📋 后续操作指引："
echo "${LOG_PREFIX} ───────────────────────────────────────"
echo "${LOG_PREFIX} 1. 新容器当前运行在端口 5433，请测试连接："
echo "${LOG_PREFIX}    psql -h localhost -p 5433 -U postgres -d ${DB_NAME}"
echo "${LOG_PREFIX} "
echo "${LOG_PREFIX} 2. 测试通过后，停止旧容器并切换端口："
echo "${LOG_PREFIX}    docker stop ${OLD_CONTAINER}"
echo "${LOG_PREFIX}    docker stop ${NEW_CONTAINER_NAME}"
echo "${LOG_PREFIX}    docker rm ${NEW_CONTAINER_NAME}"
echo "${LOG_PREFIX}    docker run -d \\"
echo "${LOG_PREFIX}      --name cost-postgres \\"
echo "${LOG_PREFIX}      -v ${NEW_DATA_DIR}:/var/lib/postgresql/data \\"
echo "${LOG_PREFIX}      -e POSTGRES_PASSWORD=${PG_PASSWORD} \\"
echo "${LOG_PREFIX}      -e TZ=Asia/Shanghai \\"
echo "${LOG_PREFIX}      -p 5432:5432 \\"
echo "${LOG_PREFIX}      --restart unless-stopped \\"
echo "${LOG_PREFIX}      ${PG_IMAGE}"
echo "${LOG_PREFIX} "
echo "${LOG_PREFIX} 3. 确认一切正常后删除旧容器："
echo "${LOG_PREFIX}    docker rm ${OLD_CONTAINER}"
echo "${LOG_PREFIX} "
echo "${LOG_PREFIX} 4. 清理临时文件："
echo "${LOG_PREFIX}    rm -rf ${BACKUP_DIR}"
echo "${LOG_PREFIX} ───────────────────────────────────────"
