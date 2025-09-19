# Zodiac Roles Modifier for TRON

This is a TRON port of the Zodiac Roles Modifier, providing granular, role-based access control for TRON Safe accounts.

## Overview

The TRON Roles Modifier allows you to:
- Define roles with specific permissions
- Assign modules to roles  
- Control which target addresses each role can interact with
- Execute transactions through role-based authorization

## Quick Start

### 1. Install Dependencies
```bash
yarn install
```

### 2. Set Up Environment
Create a `.env` file with your TRON private key:
```bash
# Create .env file
echo "PRIVATE_KEY=your_actual_private_key_here" > .env
```

**⚠️ Security Note:** Never commit your private key to version control. The `.env` file is already in `.gitignore`.

**Example .env file:**
```bash
# TRON Private Key for deployment and testing
PRIVATE_KEY=your_actual_private_key_here

# Optional: Network-specific private keys
# PRIVATE_KEY_NILE=your_nile_private_key_here
# PRIVATE_KEY_SHASTA=your_shasta_private_key_here
# PRIVATE_KEY_MAINNET=your_mainnet_private_key_here
```

### 3. Compile Contracts
```bash
yarn build
```

### 4. Run Tests
```bash
yarn test
```

### 5. Deploy to TRON Networks

#### Deploy to Nile Testnet
```bash
yarn deploy:nile
```

#### Deploy to Shasta Testnet
```bash
yarn deploy:shasta
```

#### Deploy to Mainnet
```bash
yarn deploy:mainnet
```

## TRON-Specific Features

This simplified version of the Roles modifier has been adapted for TRON with:

- **Simplified Permission Model**: Basic role-based access control
- **TRON Compatibility**: Works with TRON Safe and TRX transfers
- **Energy Optimization**: Efficient for TRON's energy model
- **TronBox Integration**: Native TRON deployment and testing

## About the Roles Modifier

This modifier allows avatars to enforce granular, role-based, permissions for attached modules.

Modules that have been granted a role are able to unilaterally make calls to any approved addresses, approved functions, and using approved parameters.

The interface mirrors the relevant parts of the Safe's interface, so this contract can be placed between Safe modules and the Safe itself to enforce role-based permissions.

The contracts have been developed with [Solidity 0.8.24](https://github.com/ethereum/solidity/releases/tag/v0.8.24) targeting evm version cancun for TRON compatibility.

## Features

- Create multiple roles
- Assign roles to addresses
- Allow roles access to call, delegate call, and/or send to address
- Scope which functions a role can call on given address
- Define conditions on function parameters

## Flow

- Define a role by setting targets, functions, and parameters that it can call
- Assign the role to an address with `assignRoles()`
- Address can now trigger the safe to call those targets, functions, and parameters via `execTransactionWithRole()`

## Usage

### 1. Deploy the Module
```javascript
const roles = await TRONRoles.new(owner, avatar, target);
```

### 2. Define Roles
```javascript
const ADMIN_ROLE = web3.utils.keccak256('ADMIN_ROLE');
const USER_ROLE = web3.utils.keccak256('USER_ROLE');
```

### 3. Assign Roles to Modules
```javascript
await roles.assignRoles(
  moduleAddress,
  [ADMIN_ROLE, USER_ROLE],
  [true, false], // module has ADMIN_ROLE, not USER_ROLE
  { from: owner }
);
```

### 4. Set Target Permissions
```javascript
await roles.setTarget(
  targetAddress,
  ADMIN_ROLE,
  true, // Allow ADMIN_ROLE to interact with targetAddress
  { from: owner }
);
```

### 5. Set Default Role for Module
```javascript
await roles.setDefaultRole(moduleAddress, ADMIN_ROLE, { from: owner });
```

### 6. Execute Transactions
Modules can now execute transactions through the roles modifier:

```javascript
// Using default role
await roles.execTransactionFromModule(
  targetAddress,
  value,
  data,
  operation,
  { from: moduleAddress }
);

// Using specific role
await roles.execTransactionWithRole(
  targetAddress,
  value,
  data,
  operation,
  roleKey,
  { from: moduleAddress }
);
```

## Integration with TRON Safe

1. Deploy the TRON Safe contract
2. Deploy this Roles module
3. Enable the Roles module on the Safe
4. Configure roles and permissions
5. Other modules can now execute transactions through role-based authorization

## Security Model

- **Role-based Access**: Modules must have specific roles to execute transactions
- **Target Restrictions**: Each role can only interact with pre-approved target addresses
- **Owner Control**: Only the owner can modify roles and permissions
- **Module Authorization**: Only enabled modules can execute transactions

## API Reference

### Core Functions

- `assignRoles(module, roleKeys, memberOf)`: Assign/revoke roles for a module
- `setDefaultRole(module, roleKey)`: Set default role for a module
- `setTarget(target, roleKey, allowed)`: Allow/deny target for a role
- `execTransactionFromModule(to, value, data, operation)`: Execute with default role
- `execTransactionWithRole(to, value, data, operation, roleKey)`: Execute with specific role

### View Functions

- `hasRole(module, roleKey)`: Check if module has role
- `isTargetAllowed(target, roleKey)`: Check if target is allowed for role
- `defaultRoles(module)`: Get default role for module

## Network Configuration

- **Mainnet**: https://api.trongrid.io
- **Nile Testnet**: https://nile.trongrid.io  
- **Shasta Testnet**: https://api.shasta.trongrid.io

## Development

### Console Access
```bash
yarn console
```

### Contract Verification
After deployment, verify contracts on TronScan using the deployment address.

## Differences from Ethereum Version

This TRON version is simplified compared to the full Zodiac Roles implementation:

- **No Complex Conditions**: Simplified to basic role and target permissions
- **No Allowance Tracking**: Removed complex allowance and consumption tracking
- **No ABI Decoding**: Simplified permission checking
- **TRON Optimized**: Designed specifically for TRON's energy model

## Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

## License

Created under the [LGPL-3.0+ license](LICENSE).
