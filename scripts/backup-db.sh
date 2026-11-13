#!/usr/bin/env bash
# GymPro MySQL backup — consistent snapshot via mysqldump --single-transaction.
# Usage: DB_HOST=127.0.0.1 DB_PORT=3307 DB_USER=gympro DB_PASSWORD=*** DB_NAME=gympro ./scripts/backup-db.sh [outdir]
set -euo pipefail
HOST="${DB_HOST:-127.0.0.1}"; PORT="${DB_PORT:-3307}"
USER="${DB_USER:-gympro}"; PASS="${DB_PASSWORD:?DB_PASSWORD required}"
DB="${DB_NAME:?DB_NAME required}"; OUT="${1:-backups}"
TS="$(date +%Y%m%d-%H%M%S)"; FILE="$OUT/${DB}-${TS}.sql.gz"
mkdir -p "$OUT"
mysqldump --single-transaction --routines --triggers \
  -h"$HOST" -P"$PORT" -u"$USER" -p"$PASS" "$DB" | gzip > "$FILE"
# integrity: dump must be non-trivial and gzip-valid
gzip -t "$FILE"
SIZE=$(stat -f%z "$FILE" 2>/dev/null || stat -c%s "$FILE")
[ "$SIZE" -gt 1024 ] || { echo "backup suspiciously small"; exit 1; }
echo "backup ok: $FILE (${SIZE} bytes)"
