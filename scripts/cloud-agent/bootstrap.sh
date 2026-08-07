#!/usr/bin/env bash
# Cloud Agent Phase 2 bootstrap — isolated local Postgres + migrate + seed + pnpm dev.
# Idempotent. Uses synthetic/test credentials only (CI-parity). Never touches production.
#
# Usage:
#   bash scripts/cloud-agent/bootstrap.sh              # prepare + pnpm dev (default)
#   bash scripts/cloud-agent/bootstrap.sh --prepare-only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

MODE="all"
if [[ "${1:-}" == "--prepare-only" ]]; then
  MODE="prepare"
fi

bash "${ROOT}/scripts/cloud-agent/prepare.sh"

if [[ "${MODE}" == "prepare" ]]; then
  exit 0
fi

# shellcheck source=env.sh
source "${ROOT}/scripts/cloud-agent/env.sh"

printf '[cloud-agent-bootstrap] Starting Vssyl with pnpm dev (web :3000, server :5000)...\n'
exec pnpm dev
