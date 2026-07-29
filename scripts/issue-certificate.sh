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

read_value() {
  awk -F= -v key="$1" '$1 == key { sub(/^[^=]*=/, ""); print }' "$ENV_FILE" | tail -n1
}

domain="$(read_value DOMAIN)"
email="$(read_value LETSENCRYPT_EMAIL)"
project_name="$(read_value COMPOSE_PROJECT_NAME)"
project_name="${project_name:-learnflow}"

if [[ ! "$domain" =~ ^[A-Za-z0-9.-]+$ || "$domain" != *.* ]]; then
  echo "Set a valid DOMAIN in $ENV_FILE." >&2
  exit 1
fi
if [[ ! "$email" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo "Set a valid LETSENCRYPT_EMAIL in $ENV_FILE." >&2
  exit 1
fi

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
if "${compose[@]}" ps --status running --services | grep -qx nginx; then
  echo "Nginx is using port 80. Stop it before issuing the initial certificate:" >&2
  echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE stop nginx" >&2
  exit 1
fi

cert_volume="${project_name}_certbot_certs"
docker volume create "$cert_volume" > /dev/null
docker run --rm --publish 80:80 \
  --volume "$cert_volume:/etc/letsencrypt" \
  certbot/certbot:v3.2.0 certonly --standalone --non-interactive --agree-tos --no-eff-email \
  --email "$email" --domain "$domain"

echo "Certificate issued for $domain. Start the production stack now."
