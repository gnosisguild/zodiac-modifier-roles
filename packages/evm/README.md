# Smart contracts

## Concepts

### PermissionChecker

#### Allowance Tracing

As the permission checker traverses down the condition config tree, it keeps a record of all parameter config nodes that utilize allowances. If the overall check is successful, this trace is utilized to track and update all allowances used by the call.
