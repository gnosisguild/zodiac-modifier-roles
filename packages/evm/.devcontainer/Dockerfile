# Devcontainer for zodiac-modifier-roles EVM package
# Provides Node.js, Foundry, and Claude Code for Solidity development

FROM node:24-bookworm

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Mark processes running inside the devcontainer
ENV ZODIAC_DEVCONTAINER=true

# Install development tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    build-essential \
    python3 \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install yarn (version matching package.json)
RUN corepack enable && corepack prepare yarn@3.7.0 --activate

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash \
    && /root/.foundry/bin/foundryup
ENV PATH="/root/.foundry/bin:${PATH}"

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Grant sudo access to node user for development convenience
RUN echo "node ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

# Install Foundry for node user
USER node
RUN curl -L https://foundry.paradigm.xyz | bash \
    && /home/node/.foundry/bin/foundryup
ENV PATH="/home/node/.foundry/bin:${PATH}"

# Set up yarn for the user
RUN corepack enable

USER root

# Set working directory
WORKDIR /workspace

# Default shell
SHELL ["/bin/bash", "-c"]
