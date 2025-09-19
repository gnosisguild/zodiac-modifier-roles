# Roles Module Constants

This directory contains centralized constants and configuration for the TRON Roles module.

## Files

- `addresses.js` - Network addresses, module configuration, and helper functions

## Usage

```javascript
const { getAddresses, getTronBoxConfig, getRolesConfig, getAdminRole } = require('./constants/addresses');

// Get network configuration
const nileConfig = getAddresses('nile');
console.log('USDT Address:', nileConfig.usdt);
console.log('Chain ID:', nileConfig.chainId);

// Get TronBox configuration
const tronboxConfig = getTronBoxConfig('nile');

// Get role keys
const adminRole = getAdminRole();
const userRole = getUserRole();
const managerRole = getManagerRole();
```

## Supported Networks

- **mainnet**: TRON Mainnet
- **nile**: Nile Testnet
- **shasta**: Shasta Testnet  
- **development**: Local development

## Configuration

### Roles Module Settings
- `adminRole`: ADMIN_ROLE keccak256 hash
- `userRole`: USER_ROLE keccak256 hash
- `managerRole`: MANAGER_ROLE keccak256 hash

### Energy Settings
- `userFeePercentage`: 100 (user pays 100% energy)
- `feeLimit`: 1000 TRX maximum
- `originEnergyLimit`: 10,000,000 energy

## Deployment Information

After deployment, contract addresses are automatically saved to:
- `deployments/{network}_roles_deployment.json` - Full deployment details
- Contains contract address, role keys, timestamps, and explorer URLs

## Helper Functions

- `getAddresses(network)` - Get all addresses for a network
- `getTronBoxConfig(network)` - Get TronBox configuration
- `getRolesConfig()` - Get roles module settings
- `getRoleKey(roleName)` - Generate keccak256 hash for role name
- `getUSDTAddress(network)` - Get USDT contract address
- `getChainId(network)` - Get chain ID
- `getFullHost(network)` - Get RPC URL
- `getExplorer(network)` - Get block explorer URL
- `getRolesModuleAddress(network)` - Get deployed roles module address
- `getAdminRole()` - Get ADMIN_ROLE keccak256 hash
- `getUserRole()` - Get USER_ROLE keccak256 hash
- `getManagerRole()` - Get MANAGER_ROLE keccak256 hash

## Role Management

The module supports three predefined roles:

1. **ADMIN_ROLE**: Full administrative access
2. **USER_ROLE**: Basic user permissions
3. **MANAGER_ROLE**: Management-level permissions

Role keys are generated using keccak256 hashing of the role name.
