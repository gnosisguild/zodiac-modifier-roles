#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: attach-agent <id>"
  echo "Example: attach-agent fix-permissions"
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

if [ ! -d "$WT" ]; then
  echo "Error: worktree not found at $WT"
  exit 1
fi

if ! git -C "$WT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: path exists but is not a git worktree: $WT"
  exit 1
fi

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

if [ -z "$RUNNING_CONTAINER_ID" ]; then
  echo "No running container found for worktree: $WT"
  exit 1
fi

exec docker exec -it "$RUNNING_CONTAINER_ID" bash
