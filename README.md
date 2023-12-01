**📯 Legacy Zodiac Roles v1 sources at: [gnosis/zodiac-modifier-roles-v1](https://github.com/gnosis/zodiac-modifier-roles-v1)**

---

# Zodiac Roles Modifier

[![Build Status](https://github.com/gnosis/zodiac-modifier-roles/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/zodiac-modifier-roles/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/zodiac-modifier-roles/badge.svg?branch=main&cache_bust=1)](https://coveralls.io/github/gnosis/zodiac-modifier-roles?branch=main)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/gnosis/CODE_OF_CONDUCT)

The Roles Modifier belongs to the [Zodiac](https://github.com/gnosis/zodiac) collection of tools, which can be accessed through the Zodiac App available on [Safe](https://safe.global/).

If you have any questions about Zodiac, join the [Gnosis Guild Discord](https://discord.gg/wwmBWTgyEq). Follow [@GnosisGuild](https://twitter.com/gnosisguild) on Twitter for updates.

### About the Roles Modifier

This modifier allows avatars to enforce granular, role-based, permissions for attached modules.

Modules that have been granted a role are able to unilaterally make calls to any approved addresses, approved functions, and using approved parameters.

The interface mirrors the relevant parts of the Safe's interface, so this contract can be placed between Safe modules and the Safe itself to enforce role-based permissions.

### Features

- Create multiple roles
- Assign roles to addresses
- Allow roles access to call, delegate call, and/or send to address
- Scope which functions a role can call on given address
- Scope which paramters are allowed on a given function

### Flow

- Define a role by setting targets, functions, and parameters that it can call
- Assign the role to an address with `assignRoles()`
- Address can now trigger the safe to call those targets, functions, and parameters via `execTransactionWithRole()`

### Development environment setup

1. For each package were a `.env.sample` file is present, copy the content of the file into a `.env` file at the same location and populate it with your keys, etc.
2. From the repo root run `yarn`
3. From the repo root run `yarn build`

After that, you can start working on the different packages.

### Solidity Compiler

The contracts have been developed with [Solidity 0.8.21](https://github.com/ethereum/solidity/releases/tag/v0.8.21) targeting evm version shanghai.

### Audits

Audits have been performed by the [G0 group](https://github.com/g0-group) and [Omniscia](https://omniscia.io).

All identified issues have been resolved as of commit [a19c0ebda97f7d645335f2c386818546641f832b](https://github.com/gnosis/zodiac-modifier-roles/tree/a19c0ebda97f7d645335f2c386818546641f832b/packages/evm/contracts)

All audit reports are available at [packages/evm/docs](packages/evm/docs).

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### License

Created under the [LGPL-3.0+ license](LICENSE).
