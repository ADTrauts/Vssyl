# shellcheck shell=bash
# Synthetic Cloud Agent development environment (CI-parity). Source only — do not execute.
# Never use production Cloud SQL, Stripe live, Postmark, or GCP credentials here.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

export PATH="${ROOT}/node_modules/.bin:${ROOT}/node_modules/.pnpm/node_modules/.bin:${PATH}"

RESOLVE_HOOK="${ROOT}/scripts/cloud-agent/resolve-js-to-ts.cjs"
if [[ -f "${RESOLVE_HOOK}" ]]; then
  case "${NODE_OPTIONS:-}" in
    *"${RESOLVE_HOOK}"*) ;;
    *)
      if [[ -n "${NODE_OPTIONS:-}" ]]; then
        export NODE_OPTIONS="--require ${RESOLVE_HOOK} ${NODE_OPTIONS}"
      else
        export NODE_OPTIONS="--require ${RESOLVE_HOOK}"
      fi
      ;;
  esac
fi

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
# Do not export PORT — Next.js and Express both honor it.

if [[ "${DATABASE_URL}" == *"cloudsql"* ]] \
  || [[ "${DATABASE_URL}" == *"vssyl_production"* ]] \
  || [[ "${DATABASE_URL}" == *"172.30."* ]]; then
  echo "[cloud-agent-env] ERROR: DATABASE_URL looks like a production/Cloud SQL connection." >&2
  return 1 2>/dev/null || exit 1
fi
if [[ "${STRIPE_SECRET_KEY:-}" == sk_live_* ]]; then
  echo "[cloud-agent-env] ERROR: Stripe live key detected." >&2
  return 1 2>/dev/null || exit 1
fi
