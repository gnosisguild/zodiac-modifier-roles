#!/usr/bin/env node

/**
 * Script to update addresses.js with deployed contract addresses
 * Usage: node scripts/update-addresses.js <network> <address>
 * Example: node scripts/update-addresses.js nile 0x1234...
 */

const fs = require('fs');
const path = require('path');

const ADDRESSES_FILE = path.join(__dirname, '..', 'constants', 'addresses.js');

function updateAddress(network, address) {
  try {
    // Read the current addresses file
    let content = fs.readFileSync(ADDRESSES_FILE, 'utf8');
    
    // Find the network section and update the rolesModule address
    const networkRegex = new RegExp(`(${network}:\\s*{[^}]*?)(\\s*rolesModule:\\s*)[^,}]*`, 'g');
    const replacement = `$1$2"${address}"`;
    
    const updatedContent = content.replace(networkRegex, replacement);
    
    if (updatedContent === content) {
      console.error(`Could not find rolesModule in ${network} network configuration`);
      process.exit(1);
    }
    
    // Write the updated content back
    fs.writeFileSync(ADDRESSES_FILE, updatedContent);
    
    console.log(`✅ Updated rolesModule address for ${network} network: ${address}`);
    
  } catch (error) {
    console.error('Error updating addresses:', error.message);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('Usage: node scripts/update-addresses.js <network> <address>');
    console.log('');
    console.log('Supported networks: mainnet, nile, shasta, development');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/update-addresses.js nile 0x1234...');
    console.log('  node scripts/update-addresses.js mainnet 0x5678...');
    process.exit(1);
  }
  
  const [network, address] = args;
  
  // Validate network
  const supportedNetworks = ['mainnet', 'nile', 'shasta', 'development'];
  if (!supportedNetworks.includes(network)) {
    console.error(`Unsupported network: ${network}. Supported: ${supportedNetworks.join(', ')}`);
    process.exit(1);
  }
  
  // Validate address format (basic check)
  if (!address.startsWith('0x') || address.length !== 42) {
    console.error(`Invalid address format: ${address}. Expected format: 0x... (42 characters)`);
    process.exit(1);
  }
  
  updateAddress(network, address);
}

if (require.main === module) {
  main();
}

module.exports = { updateAddress };
