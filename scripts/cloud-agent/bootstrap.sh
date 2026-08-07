#!/usr/bin/env bash
# Cloud Agent Phase 2 bootstrap — isolated local Postgres + migrate + seed + pnpm dev.
# Idempotent. Uses synthetic/test credentials only (CI-parity). Never touches production.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# Ensure transitive bins (e.g. ts-node via ts-node-dev) are on PATH for seed scripts.
export PATH="${ROOT}/node_modules/.bin:${ROOT}/node_modules/.pnpm/node_modules/.bin:${PATH}"

# Allow ts-node-dev to resolve ESM-style `*.js` import specifiers to `*.ts` sources.
# Production builds emit real `.js` files; local transpile-only does not.
RESOLVE_HOOK="${ROOT}/scripts/cloud-agent/resolve-js-to-ts.cjs"
if [[ -f "${RESOLVE_HOOK}" ]]; then
  if [[ -n "${NODE_OPTIONS:-}" ]]; then
    export NODE_OPTIONS="--require ${RESOLVE_HOOK} ${NODE_OPTIONS}"
  else
    export NODE_OPTIONS="--require ${RESOLVE_HOOK}"
  fi
fi

log() {
  printf '[cloud-agent-bootstrap] %s\n' "$*"
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

# --- Synthetic development environment (CI-parity; not production) ---
export NODE_ENV=development
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/vssyl_ci}"
export JWT_SECRET="${JWT_SECRET:-ci-jwt-secret-must-be-at-least-32-chars}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-ci-jwt-refresh-secret-32chars-minimum}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-ci-nextauth-secret-must-be-at-least-32-chars}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"
export BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:5000}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:5000}"
export STORAGE_PROVIDER="${STORAGE_PROVIDER:-local}"
# Do not export PORT — Next.js and Express both honor it; leaving it unset
# keeps web on 3000 and server on its default 5000.

# Refuse obvious production / live credential patterns.
if [[ "${DATABASE_URL}" == *"cloudsql"* ]] \
  || [[ "${DATABASE_URL}" == *"vssyl_production"* ]] \
  || [[ "${DATABASE_URL}" == *"172.30."* ]]; then
  log "ERROR: DATABASE_URL looks like a production/Cloud SQL connection. Refusing to start."
  exit 1
fi
if [[ "${STRIPE_SECRET_KEY:-}" == sk_live_* ]]; then
  log "ERROR: Stripe live key detected. Refusing to start."
  exit 1
fi

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

  # Prefer cluster helpers when available (may be blocked by policy-rc.d in containers).
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

  # Container-safe fallback: Debian keeps config under /etc and data under /var/lib.
  # policy-rc.d often blocks service/pg_ctlcluster inside agent containers.
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

run_as_postgres() {
  if [[ "$(id -u)" -eq 0 ]]; then
    runuser -u postgres -- "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo -u postgres "$@"
  else
    "$@"
  fi
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
  log "Running Prisma migrate deploy (canonical CI workflow)..."
  pnpm prisma:migrate:deploy

  log "Seeding test data (idempotent seed:test-data)..."
  pnpm --filter vssyl-server seed:test-data
}

start_postgres
ensure_database
migrate_and_seed

log "Starting Vssyl with pnpm dev (web :3000, server :5000)..."
exec pnpm dev
