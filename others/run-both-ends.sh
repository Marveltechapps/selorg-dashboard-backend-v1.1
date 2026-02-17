#!/usr/bin/env bash
# run-both-ends.sh
# Run backend and frontend in separate terminals with graceful fallbacks.
# Usage: ./others/run-both-ends.sh [--single]
#   --single  Run both in current terminal (background jobs + trap) instead of separate terminals.

set -e

# Resolve script path (absolute) so it works from any CWD
SCRIPT_SOURCE="${BASH_SOURCE[0]}"
[[ "$SCRIPT_SOURCE" != /* ]] && SCRIPT_SOURCE="$(pwd)/$SCRIPT_SOURCE"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"

# Backend root: prefer parent of others/, else walk up to find package.json
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [[ -f "$WORKSPACE_ROOT/package.json" ]]; then
  BACKEND_ROOT="$WORKSPACE_ROOT"
else
  # Walk up from script dir to find backend (package.json with nodemon/dev)
  BACKEND_ROOT=""
  dir="$SCRIPT_DIR"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/package.json" ]]; then
      if grep -q 'nodemon\|"dev"' "$dir/package.json" 2>/dev/null; then
        BACKEND_ROOT="$dir"
        break
      fi
    fi
    dir="$(cd "$dir/.." && pwd)"
  done
  [[ -z "$BACKEND_ROOT" ]] && BACKEND_ROOT="$WORKSPACE_ROOT"
fi
FRONTEND_ROOT="${FRONTEND_ROOT:-$BACKEND_ROOT/../selorg-dashboard-frontend-v1.1}"

BACKEND_CMD="npm run dev"
FRONTEND_CMD="npm run dev"
BACKEND_PORT="${BACKEND_PORT:-5001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

SINGLE_TERMINAL=false
for arg in "$@"; do
  case "$arg" in
    --single) SINGLE_TERMINAL=true ;;
  esac
done

# --- Helpers ---
log() { printf '[run-both-ends] %s\n' "$*" >&2; }
warn() { log "WARN: $*"; }
die() { log "ERROR: $*"; exit 1; }

# Check if a port is in use
port_in_use() {
  local port="$1"
  if command -v lsof &>/dev/null; then
    lsof -i ":$port" -sTCP:LISTEN -t &>/dev/null
  else
    (nc -z 127.0.0.1 "$port" 2>/dev/null) || false
  fi
}

# Graceful kill: SIGTERM first, then SIGKILL after short wait
graceful_kill() {
  local pid="$1"
  local name="${2:-process}"
  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  log "Stopping $name (PID $pid)..."
  kill -TERM "$pid" 2>/dev/null || true
  local n=0
  while kill -0 "$pid" 2>/dev/null && [[ $n -lt 15 ]]; do
    sleep 1
    n=$((n + 1))
  done
  if kill -0 "$pid" 2>/dev/null; then
    warn "Force-killing $name (PID $pid)"
    kill -9 "$pid" 2>/dev/null || true
  fi
}

# --- Preflight checks ---
preflight() {
  log "Preflight checks..."

  if ! command -v node &>/dev/null; then
    die "Node.js not found. Install Node.js and ensure it's on PATH."
  fi
  if ! command -v npm &>/dev/null; then
    die "npm not found. Install Node.js/npm and ensure it's on PATH."
  fi

  if [[ ! -d "$BACKEND_ROOT" ]]; then
    die "Backend root not found: $BACKEND_ROOT"
  fi
  if [[ ! -f "$BACKEND_ROOT/package.json" ]]; then
    die "Backend package.json not found at: $BACKEND_ROOT. Run from repo root or set BACKEND_ROOT."
  fi

  if [[ ! -d "$FRONTEND_ROOT" ]]; then
    die "Frontend root not found: $FRONTEND_ROOT. Set FRONTEND_ROOT if you use a different path."
  fi
  if [[ ! -f "$FRONTEND_ROOT/package.json" ]]; then
    die "Frontend package.json not found. Is FRONTEND_ROOT correct?"
  fi

  if port_in_use "$BACKEND_PORT"; then
    warn "Port $BACKEND_PORT (backend) appears in use. Backend may fail to start."
  fi
  if port_in_use "$FRONTEND_PORT"; then
    warn "Port $FRONTEND_PORT (frontend) appears in use. Frontend may fail to start."
  fi

  log "Preflight OK."
}

# --- Install dependencies (npm install) in both projects ---
install_deps() {
  log "Installing dependencies..."
  if [[ ! -d "$BACKEND_ROOT/node_modules" ]]; then
    log "Backend: npm install..."
    (cd "$BACKEND_ROOT" && npm install) || die "Backend npm install failed."
  else
    log "Backend: node_modules present (skip install)."
  fi
  if [[ ! -d "$FRONTEND_ROOT/node_modules" ]]; then
    log "Frontend: npm install..."
    (cd "$FRONTEND_ROOT" && npm install) || die "Frontend npm install failed."
  else
    log "Frontend: node_modules present (skip install)."
  fi
  log "Install OK."
}

# --- Print access links for backend and frontend ---
print_access_links() {
  printf '\n' >&2
  log "=============================================="
  log "  Access the app"
  log "=============================================="
  log "  Backend:  http://localhost:$BACKEND_PORT"
  log "  Frontend: http://localhost:$FRONTEND_PORT"
  log "=============================================="
  log "If connection refused: check the terminal windows for errors"
  log "  (.env in backend root, MongoDB reachable, ports $BACKEND_PORT / $FRONTEND_PORT free)."
  printf '\n' >&2
}

# --- Run in separate terminals (macOS Terminal.app) ---
run_separate_terminals() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    warn "Separate-terminal mode requires macOS. Falling back to --single."
    run_single_terminal
    return
  fi

  if ! command -v osascript &>/dev/null; then
    warn "osascript not found. Falling back to --single."
    run_single_terminal
    return
  fi

  log "Opening backend in new Terminal window..."
  osascript -e "tell application \"Terminal\" to do script \"cd '$BACKEND_ROOT' && $BACKEND_CMD\""

  log "Opening frontend in new Terminal window..."
  osascript -e "tell application \"Terminal\" to do script \"cd '$FRONTEND_ROOT' && $FRONTEND_CMD\""

  log "Backend and frontend started in separate Terminal windows."
  print_access_links
  log "Close each Terminal window to stop the corresponding server."
}

# --- Run both in current terminal (background jobs + trap) ---
run_single_terminal() {
  log "Running backend and frontend in current terminal (background)."
  log "Press Ctrl+C to stop both."

  BACKEND_PID=""
  FRONTEND_PID=""

  cleanup() {
    log "Shutting down..."
    graceful_kill "$BACKEND_PID" "backend"
    graceful_kill "$FRONTEND_PID" "frontend"
    log "Done."
    exit 0
  }

  trap cleanup SIGINT SIGTERM

  (cd "$BACKEND_ROOT" && $BACKEND_CMD) &
  BACKEND_PID=$!
  log "Backend started (PID $BACKEND_PID)"

  (cd "$FRONTEND_ROOT" && $FRONTEND_CMD) &
  FRONTEND_PID=$!
  log "Frontend started (PID $FRONTEND_PID)"

  print_access_links

  # Grace period: if either exits quickly, shutdown both and exit
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      warn "Backend exited early. Stopping frontend."
      graceful_kill "$FRONTEND_PID" "frontend"
      exit 1
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      warn "Frontend exited early. Stopping backend."
      graceful_kill "$BACKEND_PID" "backend"
      exit 1
    fi
  done

  wait
}

# --- Main ---
preflight
install_deps

if [[ "$SINGLE_TERMINAL" == true ]]; then
  run_single_terminal
else
  run_separate_terminals
fi
