# Zodiac Roles SDK

This package offers an SDK for managing role permissions, based on presets.

## Conditions

The SDK provides a convenience API for defining conditions on targets. Function inputs can be constrained to exact values, matched against patterns, or checked against condition functions.

### Exact constraint

If a primitive, BigNumber, or array value is given it will be used for an equality check.
This also applies to placeholders.
A contract function call will have to use exactly this value to pass the condition.

To set an exact constraint on tuples users can provide the expected tuple values as an array. For providing them as an object with named keys, it must be wrapped in an `eq({ name: 'foo', age: 30 })` condition function, to enforce an exact match rather than a pattern match.

### Matching patterns

If an object is given it will be used as a matching pattern on tuples. In a matching pattern the values to each key define the condition that shall be enforced on the respective tuple field. Each field condition can be either an exact value, a nested matching pattern, or a condition function.

Matching patterns can also be supplied as arrays using the `matches([ 1, undefined, 3 ])` condition function. This allows using matching patterns on arrays or unnamed tuples. `undefined` elements in a pattern array will allow anything to pass for that tuple member.

### Condition functions

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
- `xor`
- `nor`

#### Tuple matching

- `matches`
- `matchesAbi` (The same as `matches` but for ABI encoded `bytes` parameters)

#### Allowance conditions

- `withinAllowance`
- `etherWithinAllowance`
- `callWithinAllowance`

## Architecture

The SDK is designed in three layers of abstraction:

### Layer 1: Role patching

This layer has diffing & patching functions on role configurations, operating on JSON objects matching the `Role` type of the subgraph schema.

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

It allows computing the calls required for patching an existing role configuration to a desired target configuration, covering permissions (allowed targets) and members.
It also offers various sanity checks and normalizations for conditions.

### Layer 2: Permission presets

A permission preset is a parametrized set of permissions. It can be applied to different roles, filling in the specific parameter values for the placeholders in conditions.

On this layer, the sdk offers the `inputsMatch()` helper function for defining conditions, relying on user-provided ABIs for contract function parameters.

**Example:**

```javascript
{
  targetAddress: '0x182B723a58739a9c974cFDB385ceaDb237453c28',
  signature: "claim_rewards(address)",
  condition: inputsMatch([AVATAR], ["address"]),
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
