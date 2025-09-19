/**
 * TRON Network Addresses and Configuration for Roles Module
 * Centralized constants for the Roles module deployment and configuration
 */

const ADDRESSES = {
  // Mainnet addresses
  mainnet: {
    usdt: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    fullHost: "https://api.trongrid.io",
    explorer: "https://tronscan.org",
    // Module addresses (to be filled after deployment)
    rolesModule: null
  },
  
  // Nile testnet addresses
  nile: {
    usdt: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
    fullHost: "https://nile.trongrid.io",
    explorer: "https://nile.tronscan.org",
    faucet: "https://nileex.io/join/getJoinPage",
    // Module addresses (to be filled after deployment)
    rolesModule: null
  },
  
  // Shasta testnet addresses
  shasta: {
    usdt: "TSdZwNqpHofzP2BsBrHrjSbHbkfHEceT3k",
    fullHost: "https://api.shasta.trongrid.io",
    explorer: "https://shasta.tronscan.org",
    faucet: "https://www.trongrid.io/faucet",
    // Module addresses (to be filled after deployment)
    rolesModule: null
  },
  
  // Development/local addresses
  development: {
    usdt: "0x0000000000000000000000000000000000000000",
    fullHost: "http://127.0.0.1:9090",
    // Module addresses (to be filled after deployment)
    rolesModule: null
  }
};

const CONFIG = {
  // Energy and fee settings
  energy: {
    userFeePercentage: 100,
    feeLimit: 1000 * 1e6,
    originEnergyLimit: 10_000_000
  },
  
  // Contract versions
  versions: {
    roles: "2.1.0-tron",
    compiler: "0.8.21",
    evmVersion: "shanghai"
  },
  
  // Roles module specific settings
  roles: {
    // Role keys (keccak256 hashes)
    adminRole: "0x0000000000000000000000000000000000000000000000000000000000000000", // Will be set to keccak256("ADMIN_ROLE")
    userRole: "0x0000000000000000000000000000000000000000000000000000000000000000", // Will be set to keccak256("USER_ROLE")
    managerRole: "0x0000000000000000000000000000000000000000000000000000000000000000" // Will be set to keccak256("MANAGER_ROLE")
  },
  
  // TronBox network configurations
  tronbox: {
    development: {
      privateKey: "da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0",
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: "https://api.shasta.trongrid.io"
    },
    shasta: {
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: "https://api.shasta.trongrid.io"
    },
    nile: {
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: "https://nile.trongrid.io"
    },
    mainnet: {
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: "https://api.trongrid.io"
    }
  }
};

// Helper functions
const getAddresses = (network) => {
  if (!ADDRESSES[network]) {
    throw new Error(`Unknown network: ${network}. Supported networks: ${Object.keys(ADDRESSES).join(', ')}`);
  }
  return ADDRESSES[network];
};

const getTronBoxConfig = (network) => {
  const baseConfig = CONFIG.tronbox[network];
  if (!baseConfig) {
    throw new Error(`Unknown TronBox network: ${network}. Supported networks: ${Object.keys(CONFIG.tronbox).join(', ')}`);
  }
  
  // Add private key from environment if not in development
  if (network !== 'development' && process.env.PRIVATE_KEY) {
    return {
      ...baseConfig,
      privateKey: process.env.PRIVATE_KEY
    };
  }
  
  return baseConfig;
};

const getRolesConfig = () => {
  return CONFIG.roles;
};

const getRoleKey = (roleName) => {
  const crypto = require('crypto');
  return '0x' + crypto.createHash('sha256').update(roleName).digest('hex');
};

module.exports = {
  ADDRESSES,
  CONFIG,
  
  // Helper functions
  getAddresses,
  getTronBoxConfig,
  getRolesConfig,
  getRoleKey,
  
  // Network helpers
  getUSDTAddress: (network) => getAddresses(network).usdt,
  getFullHost: (network) => getAddresses(network).fullHost,
  getExplorer: (network) => getAddresses(network).explorer,
  
  // Module helpers
  getRolesModuleAddress: (network) => getAddresses(network).rolesModule,
  
  // Configuration helpers
  getEnergyConfig: () => CONFIG.energy,
  getVersions: () => CONFIG.versions,
  
  // Role helpers
  getAdminRole: () => getRoleKey('ADMIN_ROLE'),
  getUserRole: () => getRoleKey('USER_ROLE'),
  getManagerRole: () => getRoleKey('MANAGER_ROLE')
};
