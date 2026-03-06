#!/usr/bin/env bash
set -euo pipefail

# Symphony preflight checks run in issue workspace before each unattended attempt.

log() {
  echo "[symphony-preflight] $*"
}

fail() {
  log "ERROR: $*"
  return 1
}

check_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1
}

require_cmd() {
  local cmd="$1"
  if ! check_cmd "$cmd"; then
    fail "Missing required command: $cmd"
    return 1
  fi
  return 0
}

warn() {
  log "WARN: $*"
}

main() {
  local has_error=0

  log "Starting preflight checks"

  local required_paths=(
    "WORKFLOW.md"
    "README.md"
    "AGENTS.md"
    "ARCHITECTURE.md"
    "backend"
    "frontend"
    "docs"
    "harness"
    "scripts"
  )

  for path in "${required_paths[@]}"; do
    if [[ ! -e "$path" ]]; then
      fail "Required path missing in workspace: $path" || true
      has_error=1
    fi
  done

  local required_cmds=(
    "bash"
    "git"
    "uv"
    "npm"
    "node"
  )

  for cmd in "${required_cmds[@]}"; do
    if ! require_cmd "$cmd"; then
      has_error=1
    fi
  done

  local require_gh="${SYMPHONY_PREFLIGHT_REQUIRE_GH:-1}"
  if [[ "$require_gh" == "1" ]]; then
    if ! require_cmd "gh"; then
      has_error=1
    elif ! gh auth status >/dev/null 2>&1; then
      fail "GitHub CLI is not authenticated. Run 'gh auth login' in runtime environment." || true
      has_error=1
    fi
  else
    warn "Skipping GitHub CLI requirement (SYMPHONY_PREFLIGHT_REQUIRE_GH=$require_gh)"
  fi

  local require_linear_key="${SYMPHONY_PREFLIGHT_REQUIRE_LINEAR_API_KEY:-0}"
  if [[ "$require_linear_key" == "1" && -z "${LINEAR_API_KEY:-}" ]]; then
    fail "LINEAR_API_KEY is required but not set (SYMPHONY_PREFLIGHT_REQUIRE_LINEAR_API_KEY=1)." || true
    has_error=1
  fi

  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if ! git remote get-url origin >/dev/null 2>&1; then
      fail "Git remote 'origin' is not configured." || true
      has_error=1
    fi
  else
    fail "Workspace is not a git repository." || true
    has_error=1
  fi

  if [[ "$has_error" -ne 0 ]]; then
    log "Preflight failed"
    return 1
  fi

  log "Preflight passed"
  return 0
}

main "$@"
