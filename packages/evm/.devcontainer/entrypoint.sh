#!/bin/bash
# Entrypoint script for zodiac-modifier-roles-evm devcontainer
# Runs setup on first start, then executes the main command

set -e

SETUP_MARKER="/home/node/.devcontainer-setup-done"

ensure_owner() {
    local target="$1"
    local owner
    if [ ! -e "$target" ]; then
        return 0
    fi
    owner="$(stat -c "%u" "$target" 2>/dev/null || echo "")"
    if [ -n "$owner" ] && [ "$owner" -ne "$(id -u node)" ]; then
        chown -R node:node "$target" || true
    fi
}

# Run setup if not already done (or if node_modules is empty/new volume)
if [ ! -f "$SETUP_MARKER" ]; then
    echo "Running first-time setup..."
    cd /workspace
    if [ "$(id -u)" -eq 0 ]; then
        mkdir -p /workspace/node_modules
        ensure_owner /workspace/node_modules
        ensure_owner /home/node
        su -s /bin/bash -c "bash .devcontainer/postCreateCommand.sh" node
        su -s /bin/bash -c "touch $SETUP_MARKER" node
    else
        bash .devcontainer/postCreateCommand.sh
        touch "$SETUP_MARKER"
    fi
    echo "Setup complete."
else
    echo "Setup already done, skipping. Delete $SETUP_MARKER to re-run."
fi

# Ensure home directory is owned by node if mounted as a volume
if [ "$(id -u)" -eq 0 ]; then
    ensure_owner /home/node
    ensure_owner /workspace/node_modules
fi

# Execute the main command as node for security (when running as root)
# Use su instead of sudo to avoid triggering Claude CLI's sudo detection
if [ "$(id -u)" -eq 0 ]; then
    exec su -s /bin/bash node -c 'exec "$0" "$@"' -- "$@"
else
    exec "$@"
fi
