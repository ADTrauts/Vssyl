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

# Defense in depth: refuse known production patterns.
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

# Primary safety: DATABASE_URL must be local Cloud Agent DB only (localhost/127.0.0.1 + vssyl_ci).
assert_cloud_agent_database_url() {
  local url="${1:-${DATABASE_URL:-}}"
  if [[ -z "${url}" ]]; then
    echo "[cloud-agent-env] ERROR: DATABASE_URL is empty." >&2
    return 1
  fi

  if ! python3 - "$url" <<'PY'
import sys
from urllib.parse import urlparse, unquote

url = sys.argv[1]
try:
    parsed = urlparse(url)
except Exception as exc:  # noqa: BLE001 — fail closed on any parse error
    print(f"[cloud-agent-env] ERROR: DATABASE_URL is unparsable: {exc}", file=sys.stderr)
    sys.exit(1)

scheme = (parsed.scheme or "").lower()
if scheme not in ("postgresql", "postgres"):
    print(
        f"[cloud-agent-env] ERROR: DATABASE_URL scheme must be postgresql/postgres, got {scheme!r}.",
        file=sys.stderr,
    )
    sys.exit(1)

host = (parsed.hostname or "").lower()
if host not in ("localhost", "127.0.0.1"):
    print(
        "[cloud-agent-env] ERROR: DATABASE_URL host must be localhost or 127.0.0.1 "
        f"(got {host!r}). Refusing migrate/seed against a non-local database.",
        file=sys.stderr,
    )
    sys.exit(1)

# Path is "/vssyl_ci" (ignore empty segments / query already separated by urlparse).
db_name = unquote((parsed.path or "").lstrip("/").split("/")[0])
if db_name != "vssyl_ci":
    print(
        "[cloud-agent-env] ERROR: DATABASE_URL database must be exactly 'vssyl_ci' "
        f"(got {db_name!r}). Refusing migrate/seed.",
        file=sys.stderr,
    )
    sys.exit(1)

sys.exit(0)
PY
  then
    return 1
  fi
  return 0
}
