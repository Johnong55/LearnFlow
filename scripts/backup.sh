#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${1:-$PROJECT_DIR/.env.production}"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
BACKUP_DIR="$PROJECT_DIR/backups"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

mkdir -p -- "$BACKUP_DIR"
BACKUP_DIR="$(realpath -- "$BACKUP_DIR")"
if [[ "$BACKUP_DIR" == "/" || "$BACKUP_DIR" == "$PROJECT_DIR" ]]; then
  echo "Unsafe backup directory: $BACKUP_DIR" >&2
  exit 1
fi

retention_days="$(awk -F= '$1 == "BACKUP_RETENTION_DAYS" { print $2 }' "$ENV_FILE" | tail -n1)"
if [[ ! "$retention_days" =~ ^[0-9]+$ ]]; then
  retention_days=14
fi

umask 077
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIR/learnflow-$timestamp.dump"
temporary_file="$(mktemp "$BACKUP_DIR/.learnflow-$timestamp.XXXXXX")"
cleanup() { rm -f -- "$temporary_file"; }
trap cleanup EXIT

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
"${compose[@]}" exec -T postgres sh -ec \
  'exec pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --compress=6 --no-owner --no-privileges' \
  > "$temporary_file"

if [[ ! -s "$temporary_file" ]]; then
  echo "PostgreSQL produced an empty backup." >&2
  exit 1
fi

"${compose[@]}" exec -T postgres pg_restore --list < "$temporary_file" > /dev/null
mv -- "$temporary_file" "$backup_file"
sha256sum "$backup_file" > "$backup_file.sha256"
trap - EXIT

find "$BACKUP_DIR" -maxdepth 1 -type f \
  \( -name 'learnflow-*.dump' -o -name 'learnflow-*.dump.sha256' \) \
  -mtime "+$retention_days" -delete

echo "Backup created: $backup_file"
