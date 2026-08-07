#!/usr/bin/env bash
# Prepare isolated local Postgres + migrate + seed (idempotent). Does not start pnpm dev.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=env.sh
source "${ROOT}/scripts/cloud-agent/env.sh"
cd "$ROOT"

log() {
  printf '[cloud-agent-prepare] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR: required command not found: $1"
    exit 1
  fi
}

require_cmd pg_isready
require_cmd psql
require_cmd pnpm

PG_VERSION="$(ls /usr/lib/postgresql 2>/dev/null | sort -V | tail -1 || true)"
if [[ -z "${PG_VERSION}" ]]; then
  log "ERROR: PostgreSQL server binaries not found under /usr/lib/postgresql"
  exit 1
fi

run_as_postgres() {
  if [[ "$(id -u)" -eq 0 ]]; then
    runuser -u postgres -- "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo -u postgres "$@"
  else
    "$@"
  fi
}

start_postgres() {
  if pg_isready -h localhost -p 5432 -q; then
    log "PostgreSQL already ready on localhost:5432"
    return 0
  fi

  local pg_bin="/usr/lib/postgresql/${PG_VERSION}/bin"
  local pg_data="${PGDATA:-/var/lib/postgresql/${PG_VERSION}/main}"
  local pg_conf="${PG_CONF:-/etc/postgresql/${PG_VERSION}/main/postgresql.conf}"
  local pg_log="${PG_LOG:-/var/log/postgresql/cloud-agent-postgres.log}"

  log "Starting PostgreSQL ${PG_VERSION} (data: ${pg_data})..."

  if command -v pg_ctlcluster >/dev/null 2>&1; then
    if [[ "$(id -u)" -eq 0 ]]; then
      pg_ctlcluster "${PG_VERSION}" main start || true
    elif command -v sudo >/dev/null 2>&1; then
      sudo pg_ctlcluster "${PG_VERSION}" main start || true
    fi
  fi

  if ! pg_isready -h localhost -p 5432 -q; then
    if [[ "$(id -u)" -eq 0 ]]; then
      service postgresql start || true
    elif command -v sudo >/dev/null 2>&1; then
      sudo service postgresql start || true
    fi
  fi

  if ! pg_isready -h localhost -p 5432 -q; then
    mkdir -p "$(dirname "$pg_log")" /var/run/postgresql
    chown postgres:postgres "$(dirname "$pg_log")" /var/run/postgresql || true
    if [[ ! -d "$pg_data" ]]; then
      log "ERROR: PostgreSQL data directory missing: ${pg_data}"
      exit 1
    fi
    if [[ ! -f "$pg_conf" ]]; then
      log "ERROR: PostgreSQL config missing: ${pg_conf}"
      exit 1
    fi
    local pg_opts="-c config_file=${pg_conf} -c listen_addresses=localhost"
    if [[ "$(id -u)" -eq 0 ]]; then
      run_as_postgres "${pg_bin}/pg_ctl" -D "$pg_data" -l "$pg_log" -o "$pg_opts" -w start
    elif command -v sudo >/dev/null 2>&1; then
      sudo -u postgres "${pg_bin}/pg_ctl" -D "$pg_data" -l "$pg_log" -o "$pg_opts" -w start
    else
      "${pg_bin}/pg_ctl" -D "$pg_data" -l "$pg_log" -o "$pg_opts" -w start
    fi
  fi

  local i
  for i in $(seq 1 60); do
    if pg_isready -h localhost -p 5432 -q; then
      log "PostgreSQL is ready"
      return 0
    fi
    sleep 1
  done

  log "ERROR: PostgreSQL did not become ready within 60s"
  if [[ -f "$pg_log" ]]; then
    log "Last 40 lines of ${pg_log}:"
    tail -n 40 "$pg_log" || true
  fi
  exit 1
}

ensure_database() {
  log "Ensuring postgres role password and database vssyl_ci exist..."
  run_as_postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER postgres WITH PASSWORD 'postgres';"
  if ! run_as_postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='vssyl_ci'" | grep -q 1; then
    run_as_postgres createdb -O postgres vssyl_ci
  fi
  log "Database vssyl_ci ready"
}

migrate_and_seed() {
  log "Verifying DATABASE_URL is local Cloud Agent DB (localhost/127.0.0.1 + vssyl_ci)..."
  if ! assert_cloud_agent_database_url "${DATABASE_URL}"; then
    log "ERROR: Refusing to migrate/seed. Set DATABASE_URL to postgresql://…@localhost:5432/vssyl_ci (or 127.0.0.1)."
    exit 1
  fi

  log "Running Prisma migrate deploy (canonical CI workflow)..."
  pnpm prisma:migrate:deploy

  log "Seeding test data (idempotent seed:test-data)..."
  pnpm --filter vssyl-server seed:test-data
}

start_postgres
ensure_database
migrate_and_seed
log "Prepare complete"
