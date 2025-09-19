/**
 * TRON Network Addresses and Configuration for Roles Module
 * Centralized constants for the Roles module deployment and configuration
 */

// Helper function for role keys
const getRoleKey = (roleName) => {
  // These are the actual keccak256 hash values for role names (without 0x prefix for TRON)
  // Calculated using: keccak256("ROLE_NAME") in Solidity
  const roleHashes = {
    'ADMIN_ROLE': 'c2b6e8e1a784262ec27d89f86cdf96f4128d4bb3018cda66eaaac98009c8264c',
    'USER_ROLE': '7458c68a8d5911e046867ad77078bbb0dcc6dce6a75d9fa201035a7e604f56cb', 
    'MANAGER_ROLE': '55f77dd6b80916682b17948cfd1fe865e4f3af81a47c419611309aadaf76e376'
  };
  
  return roleHashes[roleName] || '0000000000000000000000000000000000000000000000000000000000000000';
};

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
    // Role keys (keccak256 hashes) - calculated using getRoleKey function
    adminRole: getRoleKey("ADMIN_ROLE"),
    userRole: getRoleKey("USER_ROLE"),
    managerRole: getRoleKey("MANAGER_ROLE")
  },
  
  // TronBox network configurations
  tronbox: {
    development: {
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: "https://api.shasta.trongrid.io",
      network_id: "*"
    },
    shasta: {
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: "https://api.shasta.trongrid.io",
      network_id: "*"
    },
    nile: {
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: "https://nile.trongrid.io",
      network_id: "*"
    },
    mainnet: {
      userFeePercentage: 100,
      feeLimit: 1000 * 1e6,
      fullHost: "https://api.trongrid.io",
      network_id: "*"
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
