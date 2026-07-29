#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

if [[ $# -lt 2 || "$2" != "--confirm" ]]; then
  echo "Usage: $0 /absolute/path/to/backup.dump --confirm [environment-file]" >&2
  exit 1
fi

BACKUP_FILE="$(realpath -- "$1")"
ENV_FILE="${3:-$PROJECT_DIR/.env.production}"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ -f "$BACKUP_FILE.sha256" ]]; then
  (cd -- "$(dirname -- "$BACKUP_FILE")" && sha256sum --check "$(basename -- "$BACKUP_FILE").sha256")
fi

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

# Reuse the deployed image tag when APP_VERSION is not explicitly supplied.
if [[ -z "${APP_VERSION:-}" ]]; then
  api_container="$("${compose[@]}" ps --status running --quiet api)"
  if [[ -n "$api_container" ]]; then
    deployed_image="$(docker inspect --format '{{.Config.Image}}' "$api_container")"
    if [[ "$deployed_image" == learnflow-api:* ]]; then
      APP_VERSION="${deployed_image#learnflow-api:}"
      export APP_VERSION
    fi
  fi
fi

echo "Creating a safety backup before restore..."
"$SCRIPT_DIR/backup.sh" "$ENV_FILE"

echo "Stopping API and worker for database restore..."
"${compose[@]}" stop api worker

echo "Recreating PostgreSQL database..."
"${compose[@]}" exec -T postgres sh -ec '
  dropdb --username="$POSTGRES_USER" --maintenance-db=postgres --if-exists --force "$POSTGRES_DB"
  createdb --username="$POSTGRES_USER" --owner="$POSTGRES_USER" "$POSTGRES_DB"
'

"${compose[@]}" exec -T postgres sh -ec \
  'exec pg_restore --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --no-owner --no-privileges --exit-on-error' \
  < "$BACKUP_FILE"

"${compose[@]}" run --rm migrate
"${compose[@]}" up -d api worker nginx
echo "Restore completed and application services restarted."
