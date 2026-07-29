#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${1:-$PROJECT_DIR/.env.production}"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
"${compose[@]}" --profile maintenance run --rm certbot
"${compose[@]}" exec -T nginx nginx -s reload
echo "Certificate renewal check completed and Nginx reloaded."
