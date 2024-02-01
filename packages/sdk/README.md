# Zodiac Roles SDK

This package offers an SDK for managing role permissions.

## Getting started

### Installation

This module relies on [eth-sdk](https://github.com/dethcrypto/eth-sdk) for generating type-safe APIs from automatically downloaded contract ABIs. For adding it to your project, run:

```
yarn add @dethcrypto/eth-sdk @dethcrypto/eth-sdk-client zodiac-roles-sdk
```

If you don't want to use [typed allow kits](#kits), only install `zodiac-roles-sdk` and skip the configuration step described in the following section.

```
yarn add zodiac-roles-sdk
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

You now have a typed _allow kit_ at your disposal:

```typescript
import { allow } from "zodiac-roles-sdk/kit"

const CURVE_3POOL = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"

const permissions = [allow.mainnet.dai.approve(CURVE_3POOL)]
```

### Apply permissions

Additional SDK functions allow applying a set of permissions to a role:

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

### Layer 1: Targets

This layer has diffing & patching functions on role configurations, operating on JSON objects matching the `Role` type of the subgraph schema.

**Example:**

```typescript
{
  address: "0x182B723a58739a9c974cFDB385ceaDb237453c28",
  clearance: Clearance.Function,
  functions: [
    {
      selector: "0x84e9bd7e",
      condition: {
        paramType: ParameterType.Calldata,
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
  ]
}
```

Functions:

- fetch current role configurations
- compute contract calls required for patching an existing role configuration (targets and members) to a desired configuration
- sanity checks and and normalizations for conditions

### Layer 2: Permissions

For authoring purposes it is useful to capture permissions in a slightly different structure:
Rather than the list of targets with nested functions as exposed by the subgraph, permissions are defined by a flat array of entries that grant call right to an address or a specific function at an address.

Helper functions offer a more convenient way for expressing conditions.

**Example:**

```typescript
{
  targetAddress: '0x182B723a58739a9c974cFDB385ceaDb237453c28',
  signature: "claim_rewards(address)",
  condition: c.calldataMatches([c.avatar], ["address"]),
}
```

Functions:

- support for condition authoring
- joining permissions addressing the same function

### <a name="kits"></a>Layer 3: Kits

On the highest layer of abstraction, users can generate _kits_ for contracts they want to define permission for.
A kit is a typed sdk tailored to a specific set of contracts that allows defining permissions on these in a convenient syntax and fully supported by the type system.

Users just provide the addresses of contracts. Powered by [eth-sdk](https://github.com/dethcrypto/eth-sdk) and [TypeChain](https://github.com/dethcrypto/TypeChain), ABIs will be automatically downloaded from Etherscan to generate type-safe functions for granting permissions.

**Example:**

```typescript
allow.curve.stETH_ETH_gauge["claim_rewards(address)"](c.avatar)
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
- `bitmask`

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
- `calldataMatches` (The same as `matches` but for the parameters part following the four bytes function selector of standard EVM call data)

#### Allowance conditions

- `withinAllowance`
- `etherWithinAllowance`
- `callWithinAllowance`

#### Custom conditions

- `custom` _not yet implemented in the sdk_
