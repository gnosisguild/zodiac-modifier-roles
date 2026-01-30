# Smart contracts

## Development

```bash
yarn build     # Compile contracts
yarn test      # Run tests
yarn coverage  # Run coverage
```

## Claude Agent

Run Claude Code in a sandboxed Docker container with its own git worktree:

```bash
yarn agent:launch <id>   # Create worktree + start agent
yarn agent:attach <id>   # Shell into running container
yarn agent:stop <id>     # Stop container + remove worktree
```

Requires Docker. The agent runs with `--dangerously-skip-permissions` in an isolated environment.

## Concepts

### PermissionChecker

#### Allowance Tracing

As the permission checker traverses down the condition config tree, it keeps a record of all parameter config nodes that utilize allowances. If the overall check is successful, this trace is utilized to track and update all allowances used by the call.
