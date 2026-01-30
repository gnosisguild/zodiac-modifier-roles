#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${BASE_BRANCH:-}"

if [ $# -lt 1 ]; then
  echo "Usage: launch-agent [--base <branch>] <id>"
  echo "Default base: current branch"
  echo "Example: launch-agent fix-permissions"
  exit 1
fi

if [ "${1:-}" = "--base" ] || [ "${1:-}" = "-b" ]; then
  if [ $# -lt 3 ]; then
    echo "Error: missing branch or id"
    exit 1
  fi
  BASE_BRANCH="$2"
  ID="$3"
else
  ID="$1"
fi

# Resolve repo root (where .git lives)
if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "Error: not inside a git repository"
  exit 1
fi

# Package directory
PACKAGE_DIR="$REPO_ROOT/packages/evm"

AGENTS_DIR="${REPO_ROOT}-agents"
WT="$AGENTS_DIR/$ID"
COMPOSE_FILE="$PACKAGE_DIR/.devcontainer/docker-compose.yml"

if [ -z "$BASE_BRANCH" ]; then
  if ! BASE_BRANCH="$(git symbolic-ref --quiet --short HEAD 2>/dev/null)"; then
    echo "Error: could not detect a base branch (detached HEAD)"
    echo "Run: launch-agent --base <branch> <id>"
    exit 1
  fi
fi

# sanity checks
if [ ! -d "$REPO_ROOT/.git" ]; then
  echo "Error: .git directory not found at repo root"
  exit 1
fi

if [ -e "$WT" ]; then
  if ! git -C "$WT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Error: path exists but is not a git worktree: $WT"
    exit 1
  fi
  echo "Worktree already exists at $WT"
else
  if git show-ref --verify --quiet "refs/heads/$ID"; then
    echo "Error: branch '$ID' already exists"
    exit 1
  fi
fi

mkdir -p "$AGENTS_DIR"

if [ ! -e "$WT" ]; then
  echo "Creating agent worktree:"
  echo "  Repo root:   $REPO_ROOT"
  echo "  Agents dir:  $AGENTS_DIR"
  echo "  ID / branch: $ID"
  echo "  Base branch: $BASE_BRANCH"
  echo "  Worktree:    $WT"
  echo

  cd "$REPO_ROOT"
  git worktree add "$WT" -b "$ID" "$BASE_BRANCH"

  echo
  echo "Worktree created. Starting agent..."
  echo
fi

cd "$WT/packages/evm"

WT_REAL="$(cd "$WT" && pwd -P)"
RUNNING_CONTAINER_ID=""
for CID in $(docker ps --filter "status=running" --format "{{.ID}}"); do
  MOUNT_SOURCE="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/workspace"}}{{.Source}}{{end}}{{end}}' "$CID")"
  if [ -n "$MOUNT_SOURCE" ]; then
    SOURCE_REAL="$(cd "$MOUNT_SOURCE" 2>/dev/null && pwd -P || true)"
    if [ "$SOURCE_REAL" = "$WT_REAL/packages/evm" ]; then
      RUNNING_CONTAINER_ID="$CID"
      break
    fi
  fi
done

if [ -n "$RUNNING_CONTAINER_ID" ]; then
  echo "Found running container for this worktree. Reconnecting..."
  docker exec -it "$RUNNING_CONTAINER_ID" bash -lc 'claude --dangerously-skip-permissions --append-system-prompt "$(cat .devcontainer/CLAUDE_SYSTEM_PROMPT.md)"'
  EXIT_CODE=$?
  echo "Stopping container $RUNNING_CONTAINER_ID..."
  docker stop "$RUNNING_CONTAINER_ID" >/dev/null
  exit "$EXIT_CODE"
fi

# Start Claude Code interactively inside the container
if [ -f "/.dockerenv" ] || grep -qE 'docker|container' /proc/1/cgroup 2>/dev/null; then
  echo "Error: do not run launch-agent from inside a container"
  echo "Run it on the host, then exec into the container if needed."
  exit 1
fi

# Run entrypoint for setup first (if needed), then run Claude as node
# We split this into two steps to avoid su/sudo which triggers Claude's security check
docker compose -f "$COMPOSE_FILE" run --rm \
  -v "$PWD":/workspace \
  -w /workspace \
  evm \
  bash -c 'echo "Setup check complete"' || true

# Now run Claude directly as node, bypassing the entrypoint
exec docker compose -f "$COMPOSE_FILE" run --rm \
  -u node \
  --entrypoint "" \
  -v "$PWD":/workspace \
  -w /workspace \
  evm \
  bash -lc 'claude --dangerously-skip-permissions --append-system-prompt "$(cat CLAUDE.md)"'
