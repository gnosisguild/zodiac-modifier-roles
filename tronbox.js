const { getTronBoxConfig, getVersions } = require('./constants/addresses');

// Get shared configuration
const versions = getVersions();

// Build networks from shared configuration
const networks = {};
const supportedNetworks = ['development', 'shasta', 'nile', 'mainnet'];

supportedNetworks.forEach(network => {
  try {
    networks[network] = getTronBoxConfig(network);
  } catch (error) {
    console.warn(`Warning: Could not load configuration for network ${network}:`, error.message);
  }
});

module.exports = {
  networks,
  compilers: {
    solc: {
      version: versions.compiler,
      settings: {
        optimizer: {
          enabled: true,
          runs: 100
        },
        evmVersion: versions.evmVersion
      }
    }
  },
  mocha: {
    timeout: 100000
  }
};
