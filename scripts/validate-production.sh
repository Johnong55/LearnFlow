#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${1:-$PROJECT_DIR/.env.production.example}"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi
ENV_FILE="$(realpath -- "$ENV_FILE")"

for required_command in docker openssl; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "Required command is not installed: $required_command" >&2
    exit 1
  fi
done

APP_ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet
bash -n "$SCRIPT_DIR/backup.sh" "$SCRIPT_DIR/restore.sh" \
  "$SCRIPT_DIR/issue-certificate.sh" "$SCRIPT_DIR/renew-certificates.sh"

validation_dir="$(mktemp -d)"
cleanup() { rm -rf -- "$validation_dir"; }
trap cleanup EXIT

domain="$(awk -F= '$1 == "DOMAIN" { sub(/^[^=]*=/, ""); print }' "$ENV_FILE" | tail -n1)"
if [[ ! "$domain" =~ ^[A-Za-z0-9.-]+$ || "$domain" != *.* ]]; then
  echo "Set a valid DOMAIN in $ENV_FILE." >&2
  exit 1
fi

certificate_dir="$validation_dir/letsencrypt/live/$domain"
mkdir -p -- "$certificate_dir"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -subj "/CN=$domain" \
  -keyout "$certificate_dir/privkey.pem" \
  -out "$certificate_dir/fullchain.pem" >/dev/null 2>&1

docker run --rm \
  --add-host api:127.0.0.1 \
  --add-host web:127.0.0.1 \
  --env DOMAIN="$domain" \
  --env NGINX_ENVSUBST_FILTER=DOMAIN \
  --volume "$PROJECT_DIR/nginx.conf:/etc/nginx/nginx.conf:ro" \
  --volume "$PROJECT_DIR/deploy/nginx/templates:/etc/nginx/templates:ro" \
  --volume "$validation_dir/letsencrypt:/etc/letsencrypt:ro" \
  nginx:1.27-alpine nginx -t

echo "Production Compose, shell scripts, and Nginx configuration are valid."
