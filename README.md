**This is the code for the legacy V1 contracts, current version at: [gnosis/zodiac-modifier-roles](https://github.com/gnosis/zodiac-modifier-roles)**
___

# Zodiac Roles Modifier V1

[![Build Status](https://github.com/gnosis/zodiac-modifier-roles-v1/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosis/zodiac-modifier-roles/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/zodiac-modifier-roles-v1/badge.svg?branch=main&cache_bust=1)](https://coveralls.io/github/gnosis/zodiac-modifier-roles-v1?branch=main)
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
- Scope which paramters are allowed on a given function

### Flow

- Define a role by setting targets, functions, and parameters that it can call
- Assign the role to an address with `assignRoles()`
- Address can now trigger the safe to call those targets, functions, and parameters via `executeTransactionFromModule()`

### Development environment setup

1. For each package were a `.env.sample` file is present, copy the content of the file into a `.env` file at the same location and populate it with your keys, etc.
2. From the repo root run `yarn`
3. From the repo root run `yarn build`

After that, you can start working on the different packages.

### Solidity Compiler

The contracts have been developed with [Solidity 0.8.6](https://github.com/ethereum/solidity/releases/tag/v0.8.6). This version of Solidity made all arithmetic checked by default, therefore eliminating the need for explicit overflow or underflow (or other arithmetic) checks. This version of solidity was chosen as it allows to easily cast bytes to bytes4 and bytes32.

### Audits

An audit has been performed by the [G0 group](https://github.com/g0-group).

All identified issues have been resolved as of commit [454be9d3c26f90221ca717518df002d1eca1845f](https://github.com/gnosis/zodiac-modifier-roles-v1/tree/454be9d3c26f90221ca717518df002d1eca1845f/contracts)

The audit results are available as a pdf in [this repo](packages/evm/docs/ZodiacRolesModifierJan2022.pdf).

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### License

Created under the [LGPL-3.0+ license](LICENSE).
