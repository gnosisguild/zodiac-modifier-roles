#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: stop-agent <id>"
  echo "Example: stop-agent fix-permissions"
  exit 1
fi

ID="$1"

# Resolve repo root (where .git lives)
if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "Error: not inside a git repository"
  exit 1
fi

AGENTS_DIR="${REPO_ROOT}-agents"
WT="$AGENTS_DIR/$ID"

# Check if worktree exists
if [ ! -d "$WT" ]; then
  echo "Error: worktree does not exist: $WT"
  exit 1
fi

if ! git -C "$WT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: path exists but is not a git worktree: $WT"
  exit 1
fi

# Check for uncommitted changes
cd "$WT"
if ! git diff --quiet HEAD 2>/dev/null || [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "WARNING: There are uncommitted changes in the worktree:"
  echo
  git status --short
  echo
  echo "These changes will be LOST if you proceed."
  echo
  echo "Options:"
  echo "  [y] Stop agent and DISCARD all uncommitted changes"
  echo "  [n] Cancel and leave everything as is"
  echo
  read -r -p "Proceed? [y/N] " response
  case "$response" in
    [yY][eE][sS]|[yY])
      echo "Proceeding..."
      ;;
    *)
      echo "Cancelled."
      exit 0
      ;;
  esac
fi

# Find and stop any running containers for this worktree
WT_REAL="$(pwd -P)"
STOPPED_CONTAINERS=0

for CID in $(docker ps --filter "status=running" --format "{{.ID}}" 2>/dev/null || true); do
  MOUNT_SOURCE="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/workspace"}}{{.Source}}{{end}}{{end}}' "$CID" 2>/dev/null || true)"
  if [ -n "$MOUNT_SOURCE" ]; then
    SOURCE_REAL="$(cd "$MOUNT_SOURCE" 2>/dev/null && pwd -P || true)"
    if [ "$SOURCE_REAL" = "$WT_REAL/packages/evm" ]; then
      echo "Stopping container $CID..."
      docker stop "$CID" >/dev/null
      STOPPED_CONTAINERS=$((STOPPED_CONTAINERS + 1))
    fi
  fi
done

if [ "$STOPPED_CONTAINERS" -gt 0 ]; then
  echo "Stopped $STOPPED_CONTAINERS container(s)."
fi

# Remove the worktree (keeps the branch intact)
cd "$REPO_ROOT"
echo "Removing worktree at $WT..."
git worktree remove --force "$WT"

echo
echo "Agent '$ID' stopped."
echo "Branch '$ID' is preserved and can still be merged."
