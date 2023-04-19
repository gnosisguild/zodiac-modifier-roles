**⚠️ This is the code for the yet unaudited v2 contracts, find v1 sources at: [gnosis/zodiac-modifier-roles-v1](https://github.com/gnosis/zodiac-modifier-roles-v1)**

---

# Zodiac Roles Modifier

[![Build Status](https://github.com/gnosis/zodiac-modifier-roles/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/zodiac-modifier-roles/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/zodiac-modifier-roles/badge.svg?branch=main&cache_bust=1)](https://coveralls.io/github/gnosis/zodiac-modifier-roles?branch=main)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/gnosis/CODE_OF_CONDUCT)

The Roles Modifier belongs to the [Zodiac](https://github.com/gnosis/zodiac) collection of tools, which can be accessed through the Zodiac App available on [Gnosis Safe](https://gnosis-safe.io/), as well as in this repository.

If you have any questions about Zodiac, join the [Gnosis Guild Discord](https://discord.gg/wwmBWTgyEq). Follow [@GnosisGuild](https://twitter.com/gnosisguild) on Twitter for updates.

### About the Roles Modifier

This modifier allows avatars to enforce granular, role-based, permissions for attached modules.

Modules that have been granted a role are able to unilaterally make calls to any approved addresses, approved functions, and approved variables the role has access to.

The interface mirrors the relevant parts of the Gnosis Safe's interface, so this contract can be placed between Gnosis Safe modules and a Gnosis Safe to enforce role-based permissions.

### Features

- Create multiple roles
- Assign roles to addresses
- Allow roles access to call, delegate call, and/or send to address
- Scope which functions a role can call on given address
- Define conditions on function parameters

### Flow

- Define a role by setting targets, functions, and parameters that it can call
- Assign the role to an address with `assignRoles()`
- Address can now trigger the safe to call those targets, functions, and parameters via `executeTransactionFromModule()`

### Development environment setup

1. For each package were a `.env.sample` file is present, copy the content of the file into a `.env` file at the same location and populate it with your keys, etc.
2. From the repo root run `yarn`
3. From the repo root run `yarn prepare`
4. From the repo root run `yarn build`

After that, you can start working on the different packages.

### Packages

- evm: Roles mod smart contracts
- subgraph: a subgraph indexing deployed Roles mod instances
- sdk: a TypeScript SDK for managing roles
- app: a webapp for editing roles

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### License

Created under the [LGPL-3.0+ license](LICENSE).
