# Zodiac Roles SDK

This package offers an SDK for managing role permissions, based on presets.

## Architecture

The SDK is designed in three layers of abstraction:

### Layer 1: Role patching

This layer has diffing & patching functions on role configurations, operating on JSON objects matching the `Role` type of the subgraph schema.

It allows computing the calls required for patching an existing role configuration to a desired target configuration, covering permissions (allowed targets) and members.
It also offers various sanity checks and normalizations for conditions.

**Example:**

```javascript
{
  targetAddress: "0x182B723a58739a9c974cFDB385ceaDb237453c28",
  selector: "0x84e9bd7e",
  condition: {
    paramType: ParameterType.AbiEncoded,
    operator: Operator.Matches,
    children: [
      {
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: defaultAbiCoder.encode(["address"], ["0x4F2083f5fBede34C2714aFfb3105539775f7FE64"]),
      }
    ],
  },
}
```

### Layer 2: Permission presets

A permission preset is a parametrized set of permissions. It can be applied to different roles, filling in the specific parameter values for the placeholders in conditions.

On this layer, the sdk offers [low-level helper functions](src/presets/helpers) for defining conditions, relying on user-provided ABIs for contract function parameters.

**Example:**

```javascript
{
  targetAddress: '0x182B723a58739a9c974cFDB385ceaDb237453c28',
  signature: "claim_rewards(address)",
  condition: matches([equalTo(AVATAR)], ["address"]),
}
```

### Layer 3: Typed allow kits

On the highest layer of abstraction, users can generate _allow kits_ for contracts they want to permission.
An allow kit is a typed sdk tailored to a specific set of contracts that allows defining permissions on these in a convenient syntax and fully supported by the type system.

Users just provide the addresses of contracts. Powered by [eth-sdk](https://github.com/dethcrypto/eth-sdk) and [TypeChain](https://github.com/dethcrypto/TypeChain), ABIs will be automatically downloaded from Etherscan to generate type-safe functions for granting permissions.

**Example:**

```javascript
allow.curve.stETH_ETH_gauge["claim_rewards(address)"](AVATAR)
```
