# Zodiac Roles SDK

This package offers an SDK for managing role permissions, based on presets.

## Getting started

### Installation

This module relies on [eth-sdk](https://github.com/dethcrypto/eth-sdk) for generating type-safe APIs from automatically downloaded contract ABIs. For adding it to your project, run:

```
yarn add @dethcrypto/eth-sdk zodiac-roles-sdk
```

### Configuration

The first step is to create a config file specifying contracts that we want to allow calling to. The default path to this file is `eth-sdk/config.ts`.

```typescript
import { defineConfig } from "@dethcrypto/eth-sdk"

export default defineConfig({
  contracts: {
    mainnet: {
      dai: "0x6b175474e89094c44da98b954eedeac495271d0f",
    },
  },
})
```

Now–and after any update to the config file–make sure to run the following command:

```
yarn eth-sdk
```

This will fetch the ABIs of the contracts listed in the config file and generate TypeScript types for them directly into your node_modules.

Refer to the [eth-sdk docs](https://github.com/dethcrypto/eth-sdk#configuration) for a complete overview of the available configuration options.

### Define permissions

You now have typed _allow kit_ at your disposal:

```typescript
import { allow } from "zodiac-roles-sdk"

const CURVE_3POOL = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"

const permissions = [allow.mainnet.dai.approve(CURVE_3POOL)]
```

### Apply permissions

Additional sdk function allow applying a set of permissions to a role:

```typescript
import { applyPermissions } from "zodiac-roles-sdk"

const calls = applyPermissions(MY_ROLE_KEY, permissions, {
  network: 1,
  address: ROLES_MOD_ADDRESS,
})
```

This will fetch the permissions currently configured for the role identified by `MY_ROLE_KEY` and compute the set of calls required to patch it to the new set of `permissions`.
You can execute the calls via ethers:

```typescript
calls.forEach(async (data) => {
  await provider.call({ to: ROLES_MOD_ADDRESS, data }) // signer must be the `owner` of the roles mod
})
```

Or batch them as a multi-send:

```typescript
import { encodeMulti } from "ethers-multisend"

const multiSendTx = encodeMulti(
  calls.map((data) => ({ to: ROLES_MOD_ADDRESS, value: 0, data }))
)
```

## Architecture

The SDK is designed in three layers of abstraction:

### Layer 1: Role patching

This layer has diffing & patching functions on role configurations, operating on JSON objects matching the `Role` type of the subgraph schema.

**Example:**

```typescript
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

It allows computing the calls required for patching an existing role configuration to a desired target configuration, covering permissions (allowed targets) and members.
It also offers various sanity checks and normalizations for conditions.

### Layer 2: Permission presets

A permission preset is a parametrized set of permissions. It can be applied to different roles, filling in the specific parameter values for the placeholders in conditions.

**Example:**

```typescript
{
  targetAddress: '0x182B723a58739a9c974cFDB385ceaDb237453c28',
  signature: "claim_rewards(address)",
  condition: c.matchesAbi([AVATAR], ["address"]),
}
```

### Layer 3: Typed allow kits

On the highest layer of abstraction, users can generate _allow kits_ for contracts they want to permission.
An allow kit is a typed sdk tailored to a specific set of contracts that allows defining permissions on these in a convenient syntax and fully supported by the type system.

Users just provide the addresses of contracts. Powered by [eth-sdk](https://github.com/dethcrypto/eth-sdk) and [TypeChain](https://github.com/dethcrypto/TypeChain), ABIs will be automatically downloaded from Etherscan to generate type-safe functions for granting permissions.

**Example:**

```typescript
allow.curve.stETH_ETH_gauge["claim_rewards(address)"](AVATAR)
```

## Conditions

The SDK provides a convenience API for defining conditions on targets. Function inputs can be constrained to exact values, matched against patterns, or checked against condition functions.

### Exact constraint

If a primitive, BigNumber, or array value is given it will be used for an equality check.
This also applies to placeholders.
A contract function call will have to use exactly this value to pass the condition.

To set an exact constraint on tuples users can provide the expected tuple values as an array. For providing them as an object with named keys, it must be wrapped in an `c.eq({ name: 'foo', age: 30 })` condition function, to enforce an exact match rather than a pattern match.

### Matching patterns

If an object is given it will be used as a matching pattern on tuples. In a matching pattern the values to each key define the condition that shall be enforced on the respective tuple field. Each field condition can be either an exact value, a nested matching pattern, or a condition function.

Matching patterns can also be supplied as arrays using the `c.matches([ 1, undefined, 3 ])` condition function. This allows using matching patterns on arrays or unnamed tuples. `undefined` elements in a pattern array will allow anything to pass for that tuple member.

### Condition functions

Helper functions for defining conditions are provided under the `c` export:

```typescript
import { c } from 'zodiac-roles-sdk;

c.or(1, 2, 3) // a condition that checks if a numeric parameter equals either of `1`, `2` or `3`
```

#### Comparisons

- `eq`
- `lt`
- `gt`
- `bitmask` _not yet implemented_

#### Array conditions

- `some`
- `every`
- `subset`

#### Branch conditions

- `and`
- `or`
- `nor`

#### Tuple matching

- `matches`
- `matchesAbi` (The same as `matches` but for ABI encoded `bytes` parameters)

#### Allowance conditions

- `withinAllowance`
- `etherWithinAllowance`
- `callWithinAllowance`

#### Custom conditions

- `custom` _not yet implemented_
