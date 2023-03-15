# Smart contracts

## Concepts

### PermissionChecker

#### Allowance tracing

As the permission checker walks down the parameter config tree it records all applied parameter config nodes that use allowances.
If the overall check is successful this trace is used for tracking and updating all allowances used by the call.
