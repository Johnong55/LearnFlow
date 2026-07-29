# LearnFlow production deployment

This runbook deploys LearnFlow to one Ubuntu VPS with Docker Compose. Nginx is
the only public container; PostgreSQL and Redis stay on an internal Docker
network.

## 1. Prepare the VPS

Use a supported Ubuntu LTS release with at least 2 CPU cores, 4 GB RAM, and
enough disk for PostgreSQL data and backups. Keep SSH key authentication enabled.
The supplied systemd units assume a dedicated non-root account named
`learnflow`:

```bash
sudo adduser --disabled-password --gecos '' learnflow
sudo usermod -aG docker learnflow
sudo install -d -o learnflow -g learnflow /opt/learnflow
```

Install Docker Engine and the Docker Compose plugin from Docker's official apt
repository, then verify the installation:

```bash
docker version
docker compose version
```

Docker group membership grants root-equivalent access. Only add the dedicated
deployment operator if passwordless Docker commands are required.

## 2. DNS and firewall

Create an `A` record for the API hostname pointing to the VPS public IPv4
address. Add an `AAAA` record only when IPv6 is configured on the server. Wait
until the record resolves before requesting a certificate:

```bash
getent ahosts api.example.com
```

Allow SSH before enabling the firewall, then expose only HTTP and HTTPS:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Do not publish ports 5432 or 6379. Docker-published ports can bypass some UFW
rules, so review `docker-compose.prod.yml` after every networking change. It
must publish only Nginx ports 80 and 443.

## 3. Install the application

Run the application setup as the dedicated deployment account:

```bash
sudo -iu learnflow
git clone https://github.com/Johnong55/LearnFlow.git /opt/learnflow
cd /opt/learnflow
cp .env.production.example .env.production
chmod 600 .env.production
```

If a different account or directory is used, update `User`, `Group`,
`WorkingDirectory`, and `ExecStart` in every supplied systemd service first.

Edit `.env.production` and replace every example value. Required choices:

- Set `DOMAIN` to the API hostname and `LETSENCRYPT_EMAIL` to an operations
  address.
- Set `CORS_ORIGINS` to the exact HTTPS frontend origins, comma separated.
- Generate distinct JWT secrets with `openssl rand -base64 48`.
- Generate separate PostgreSQL and Redis passwords. URL-encode special
  characters when putting those passwords into `DATABASE_URL` or `REDIS_URL`.
- Keep `COOKIE_SECURE=true`, `TRUST_PROXY=true`, and `SWAGGER_ENABLED=false`.
- Select real search and LLM adapters only after their provider-specific
  credentials and adapters have been configured.

The production environment file is ignored by Git. Never copy it into an image
or commit it.

## 4. Issue the initial TLS certificate

Port 80 must be reachable and no other process may be listening on it. Request
the first certificate before starting Nginx because Nginx refuses to start
without the certificate files:

```bash
cd /opt/learnflow
./scripts/issue-certificate.sh
```

The script uses the configured domain and email and saves the certificate in a
named Docker volume. If another web server owns port 80, stop it first.

## 5. Build and start

Use the Git commit as the immutable local image tag:

```bash
cd /opt/learnflow
git fetch --tags origin
git checkout main
git pull --ff-only origin main
export APP_VERSION="$(git rev-parse --short=12 HEAD)"
docker compose --env-file .env.production -f docker-compose.prod.yml build migrate api worker
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

The one-shot `migrate` service runs `prisma migrate deploy`. API and worker are
started only after migrations complete successfully. Confirm the result:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl --fail --silent --show-error https://api.example.com/health/live
curl --fail --silent --show-error https://api.example.com/health/ready
```

Readiness checks PostgreSQL, Redis, and BullMQ. A failed readiness response
means the container is alive but should not receive production traffic.

## 6. Inspect logs and health

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 api worker nginx
docker compose --env-file .env.production -f docker-compose.prod.yml logs --since=30m api
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker stats --no-stream
docker system df
```

API logs and Nginx access logs are structured JSON. Docker rotates each service
log at 10 MB and retains five files. Forward logs to a remote log service before
running multiple hosts.

For monitoring, poll `/health/live` and `/health/ready` externally over HTTPS.
Alert on repeated readiness failures, container restarts, disk usage, backup
age, certificate expiry, BullMQ failures, and PostgreSQL volume growth.

## 7. Back up and restore PostgreSQL

Create a compressed PostgreSQL custom-format backup and checksum:

```bash
cd /opt/learnflow
./scripts/backup.sh
ls -lh backups/
```

Backups are mode-restricted and retained for `BACKUP_RETENTION_DAYS`. Copy them
to encrypted off-host storage; a backup on the same VPS is not disaster
recovery. Regularly test restoration on a non-production server.

Restore is destructive to the current database. The script requires an
explicit confirmation flag, verifies the checksum when present, and creates a
safety backup first:

```bash
cd /opt/learnflow
./scripts/restore.sh /opt/learnflow/backups/learnflow-YYYYMMDDTHHMMSSZ.dump --confirm
```

The API and worker are stopped during restore. If restoration fails, inspect the
error before restarting them; the safety backup remains in `backups/`.

## 8. Automate maintenance

Install the supplied systemd units after checking their user and paths:

```bash
sudo cp deploy/systemd/learnflow-backup.service /etc/systemd/system/
sudo cp deploy/systemd/learnflow-backup.timer /etc/systemd/system/
sudo cp deploy/systemd/learnflow-cert-renew.service /etc/systemd/system/
sudo cp deploy/systemd/learnflow-cert-renew.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now learnflow-backup.timer learnflow-cert-renew.timer
systemctl list-timers 'learnflow-*'
```

Review executions with:

```bash
journalctl -u learnflow-backup.service
journalctl -u learnflow-cert-renew.service
```

Certificate renewal uses Certbot's webroot mode and reloads Nginx only after a
successful renewal check.

## 9. Update and rollback

Create a backup before each release. Record both the current commit and image
tag, then deploy a reviewed commit:

```bash
cd /opt/learnflow
./scripts/backup.sh
git fetch --tags origin
git checkout main
git pull --ff-only origin main
export APP_VERSION="$(git rev-parse --short=12 HEAD)"
docker compose --env-file .env.production -f docker-compose.prod.yml build migrate api worker
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

For an application rollback, check out the last known-good tag or commit,
rebuild it with its own `APP_VERSION`, and run `up -d` again. Prisma migrations
are forward-only: do not try to reverse them automatically. If an incompatible
release changed the schema or data, use the pre-release backup and the restore
procedure after evaluating the data-loss impact.

## 10. Operational security checklist

- Disable password SSH login after confirming key access; keep the OS and
  Docker Engine patched.
- Store `.env.production` and backups with restrictive permissions and keep an
  encrypted off-host copy.
- Keep Swagger disabled publicly. If temporary access is needed, additionally
  restrict it at Nginx or through a private network.
- Rotate JWT, database, Redis, provider, and email credentials after suspected
  exposure. Rotating JWT secrets invalidates active sessions.
- Never run PostgreSQL or Redis with a public `ports` mapping.
- Review audit logs and failed authentication/rate-limit events.
- Test restore, certificate renewal, health alerts, and rollback periodically.
