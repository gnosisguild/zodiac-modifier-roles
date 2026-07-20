#!/bin/bash
# Post-create setup script for zodiac-modifier-roles-evm devcontainer
# This script runs after the container is created

set -e

echo "========================================"
echo "Setting up zodiac-modifier-roles-evm devcontainer..."
echo "========================================"

# Enable corepack for yarn
corepack enable

# Install dependencies
echo ""
echo "Installing dependencies with yarn..."
yarn install


echo ""
echo "========================================"
echo "Devcontainer setup complete!"
echo "========================================"
echo ""
echo "Available commands:"
echo "  yarn build     - Compile contracts"
echo "  yarn test      - Run tests"
echo "  yarn coverage  - Run coverage"
echo ""
