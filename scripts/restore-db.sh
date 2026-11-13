#!/usr/bin/env bash
# Restore a backup into a DIFFERENT schema — refuses to overwrite the source DB.
# Usage: DB_PASSWORD=*** ./scripts/restore-db.sh backup.sql.gz target_db
set -euo pipefail
FILE="${1:?backup file required}"; TARGET="${2:?target schema required}"
SRC_DB="${SRC_DB:-gympro}"; [ "$TARGET" != "$SRC_DB" ] || { echo "refusing to restore over source DB"; exit 1; }
HOST="${DB_HOST:-127.0.0.1}"; PORT="${DB_PORT:-3307}"
USER="${DB_USER:-gympro}"; PASS="${DB_PASSWORD:?DB_PASSWORD required}"
mysql -h"$HOST" -P"$PORT" -u"$USER" -p"$PASS" -e "CREATE DATABASE IF NOT EXISTS \`$TARGET\` CHARACTER SET utf8mb4;"
gzip -dc "$FILE" | mysql -h"$HOST" -P"$PORT" -u"$USER" -p"$PASS" "$TARGET"
echo "restored $FILE -> $TARGET"
