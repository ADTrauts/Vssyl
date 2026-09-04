#!/usr/bin/env bash
# Canonical Vssyl secret scan (working tree).
# Used by: humans, Cursor agents, `pnpm security:secrets`, and CI.
#
# Default: scan current working tree (--no-git) so rotated historical Git
# objects are not a daily merge blocker.
# Pass --history to audit full Git history (manual / informational).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GITLEAKS_VERSION="${GITLEAKS_VERSION:-8.30.1}"
CONFIG="${ROOT}/.gitleaks.toml"
CACHE_DIR="${ROOT}/.cache/gitleaks"
MODE="tree"

usage() {
  cat <<'EOF'
Usage: scripts/security-secrets.sh [--history] [--help]

  (default)  Scan the current working tree with .gitleaks.toml
  --history  Scan full Git history (manual audit; may flag rotated legacy secrets)
  --help     Show this help

Environment:
  GITLEAKS_VERSION   Pinned Gitleaks release (default: 8.30.1)
  GITLEAKS_BIN       Optional path to an existing gitleaks binary
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --history) MODE="history"; shift ;;
    --help|-h) usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$CONFIG" ]]; then
  echo "ERROR: missing ${CONFIG}" >&2
  exit 1
fi

resolve_bin() {
  if [[ -n "${GITLEAKS_BIN:-}" && -x "${GITLEAKS_BIN}" ]]; then
    echo "${GITLEAKS_BIN}"
    return
  fi
  if command -v gitleaks >/dev/null 2>&1; then
    local ver
    ver="$(gitleaks version 2>/dev/null | head -1 || true)"
    if [[ "$ver" == *"${GITLEAKS_VERSION}"* ]]; then
      command -v gitleaks
      return
    fi
  fi
  local os arch asset
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *)
      echo "ERROR: unsupported architecture: ${arch}" >&2
      exit 1
      ;;
  esac
  case "$os" in
    darwin) asset="gitleaks_${GITLEAKS_VERSION}_darwin_${arch}.tar.gz" ;;
    linux) asset="gitleaks_${GITLEAKS_VERSION}_linux_${arch}.tar.gz" ;;
    *)
      echo "ERROR: unsupported OS: ${os}" >&2
      exit 1
      ;;
  esac

  mkdir -p "${CACHE_DIR}"
  local bin="${CACHE_DIR}/gitleaks-${GITLEAKS_VERSION}"
  if [[ ! -x "$bin" ]]; then
    local url="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${asset}"
    local tmp
    tmp="$(mktemp -d)"
    echo "Fetching Gitleaks v${GITLEAKS_VERSION}..." >&2
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL "$url" -o "${tmp}/${asset}"
    elif command -v python3 >/dev/null 2>&1; then
      python3 - "$url" "${tmp}/${asset}" <<'PY'
import sys, urllib.request
urllib.request.urlretrieve(sys.argv[1], sys.argv[2])
PY
    else
      echo "ERROR: need curl or python3 to download Gitleaks" >&2
      exit 1
    fi
    tar -xzf "${tmp}/${asset}" -C "${tmp}"
    mv "${tmp}/gitleaks" "$bin"
    chmod +x "$bin"
    rm -rf "${tmp}"
  fi
  echo "$bin"
}

BIN="$(resolve_bin)"
TMP_REPORT="$(mktemp)"
cleanup() { rm -f "$TMP_REPORT"; }
trap cleanup EXIT

echo "Gitleaks ${GITLEAKS_VERSION} | config=.gitleaks.toml | mode=${MODE}" >&2

set +e
if [[ "$MODE" == "history" ]]; then
  echo "WARNING: full-history audit may report already-rotated legacy secrets." >&2
  echo "This mode is informational and is not required for CI green." >&2
  "${BIN}" detect \
    --source="${ROOT}" \
    --config="${CONFIG}" \
    --redact \
    --report-format=json \
    --report-path="${TMP_REPORT}"
  status=$?
else
  "${BIN}" detect \
    --source="${ROOT}" \
    --no-git \
    --config="${CONFIG}" \
    --redact \
    --report-format=json \
    --report-path="${TMP_REPORT}"
  status=$?
fi
set -e

if [[ $status -eq 0 ]]; then
  echo "OK: no secrets detected in ${MODE} scan." >&2
  exit 0
fi

if [[ $status -eq 1 ]]; then
  if command -v python3 >/dev/null 2>&1 && [[ -s "$TMP_REPORT" ]]; then
    python3 - "$TMP_REPORT" <<'PY' >&2
import json, sys
from collections import Counter
path = sys.argv[1]
try:
    data = json.load(open(path))
except Exception as e:
    print(f"Findings present (could not parse report: {e})")
    raise SystemExit(0)
print(f"FINDINGS: {len(data)}")
c = Counter()
for item in data:
    rule = item.get("RuleID") or item.get("Rule") or "?"
    file = item.get("File") or item.get("Path") or "?"
    line = item.get("StartLine") or item.get("Line") or "?"
    c[rule] += 1
    print(f"  rule={rule} file={file} line={line}")
print("By rule:")
for rule, n in c.most_common():
    print(f"  {rule}: {n}")
print("Remediate or narrow-allowlist placeholders only. Never allowlist real credentials.")
PY
  else
    echo "FINDINGS detected (exit 1). Review output; do not commit secrets." >&2
  fi
  exit 1
fi

echo "ERROR: gitleaks failed with status ${status}" >&2
exit "$status"
