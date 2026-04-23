#!/usr/bin/env bash
# Minimal startup / update script for the Cursor Event Portal (Next.js).
#
# What it does:
#   1. Checks Node.js major version against package.json engines (>=20 <21)
#      and the pinned version in .nvmrc / .node-version (20.18.1).
#      If nvm is available and the current Node is out of range, it auto-switches.
#   2. Runs `npm install` to install dependencies (matching render.yaml buildCommand).
#   3. Ensures a local .env.local exists (copies from .env.local.example if missing)
#      so mock-mode dev (`NEXT_PUBLIC_USE_MOCK_DATA=true`) works without Supabase.
#
# Usage:
#   ./scripts/startup.sh           # install + env bootstrap
#   ./scripts/startup.sh --build   # also run `npm run build` afterwards
#
# Intentionally minimal: no OS package installs, no service management.

set -euo pipefail

REQUIRED_MAJOR=20
PINNED_VERSION_FILE=".nvmrc"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '[startup] %s\n' "$*"; }
err() { printf '[startup] ERROR: %s\n' "$*" >&2; }

# --- 1. Node version check ------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  err "node is not installed. Install Node.js ${REQUIRED_MAJOR} (see .nvmrc: $(cat $PINNED_VERSION_FILE 2>/dev/null || echo unknown))."
  exit 1
fi

current_major="$(node -p 'process.versions.node.split(".")[0]')"
pinned_version="$(cat "$PINNED_VERSION_FILE" 2>/dev/null || echo "")"

if [ "$current_major" != "$REQUIRED_MAJOR" ]; then
  log "Current Node $(node -v) does not satisfy package.json engines (>=${REQUIRED_MAJOR} <$((REQUIRED_MAJOR + 1)))."
  if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
    log "Switching to Node $pinned_version via nvm..."
    nvm install "$pinned_version" >/dev/null
    nvm use "$pinned_version" >/dev/null
    log "Now on Node $(node -v)."
  else
    err "nvm not found. Install Node ${REQUIRED_MAJOR} (pinned: ${pinned_version:-20.18.1}) and re-run."
    err "Quick install: 'nvm install ${pinned_version:-20.18.1} && nvm use ${pinned_version:-20.18.1}'"
    exit 1
  fi
fi

log "Using Node $(node -v) / npm $(npm -v)."

# --- 2. Install dependencies ---------------------------------------------
log "Running npm install..."
npm install

# --- 3. Bootstrap local env ----------------------------------------------
if [ ! -f .env.local ] && [ -f .env.local.example ]; then
  cp .env.local.example .env.local
  log "Created .env.local from .env.local.example. Set NEXT_PUBLIC_USE_MOCK_DATA=true to run without Supabase."
fi

# --- 4. Optional build ---------------------------------------------------
if [ "${1:-}" = "--build" ]; then
  log "Running npm run build..."
  npm run build
fi

log "Done. Start the dev server with: npm run dev"
