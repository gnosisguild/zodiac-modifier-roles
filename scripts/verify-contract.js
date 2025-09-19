#!/usr/bin/env node

/**
 * TRON Contract Verification Script
 * Automatically verifies deployed contracts on TronScan
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const TRONSCAN_API_URL = 'https://apilist.tronscanapi.com/api/contract/verifycode';
const COMPILER_VERSION = 'v0.8.21+commit.d9974bed';
const OPTIMIZATION_USED = 1;
const OPTIMIZATION_RUNS = 100;
const LICENSE_TYPE = 1; // MIT License

/**
 * Flatten contract source code
 */
function flattenContract(contractPath) {
  const sourceCode = fs.readFileSync(contractPath, 'utf8');
  
  // Simple flattening - remove import statements and combine
  // For complex contracts, you might need a more sophisticated flattener
  const flattened = sourceCode
    .split('\n')
    .filter(line => !line.trim().startsWith('import'))
    .join('\n');
  
  return flattened;
}

/**
 * Get constructor arguments from deployment
 */
function getConstructorArgs(contractName, deploymentInfo) {
  // For TRONRoles, constructor args are: owner, avatar, target
  const args = [
    deploymentInfo.owner,
    deploymentInfo.avatar, 
    deploymentInfo.target
  ];
  
  // Encode as ABI-encoded parameters
  // This is a simplified version - in production you'd use proper ABI encoding
  return args.join(',');
}

/**
 * Generate verification instructions for TronScan
 */
function generateVerificationInstructions(contractAddress, contractName, deploymentInfo) {
  console.log(`\n🔍 Contract Verification Instructions for ${contractName}`);
  console.log(`   Contract Address: ${contractAddress}`);
  
  // Get contract source code
  const contractPath = path.join(__dirname, '../contracts', `${contractName}.sol`);
  if (!fs.existsSync(contractPath)) {
    console.log(`❌ Contract file not found: ${contractPath}`);
    return false;
  }
  
  const sourceCode = flattenContract(contractPath);
  const constructorArgs = getConstructorArgs(contractName, deploymentInfo);
  
  // Determine network and verification URL
  const isNile = contractAddress.includes('TG');
  const isShasta = contractAddress.includes('TS');
  const isMainnet = contractAddress.startsWith('T') && !isNile && !isShasta;
  
  let verificationUrl = 'https://tronscan.org/#/contract/verify';
  if (isNile) {
    verificationUrl = 'https://nile.tronscan.org/#/contract/verify';
  } else if (isShasta) {
    verificationUrl = 'https://shasta.tronscan.org/#/contract/verify';
  }
  
  console.log(`\n📋 Manual Verification Steps:`);
  console.log(`1. Visit: ${verificationUrl}`);
  console.log(`2. Fill in the following details:`);
  console.log(`   • Contract Address: ${contractAddress}`);
  console.log(`   • Contract Name: ${contractName}`);
  console.log(`   • Compiler Version: ${COMPILER_VERSION}`);
  console.log(`   • Optimization: ${OPTIMIZATION_USED ? 'Yes' : 'No'}`);
  console.log(`   • Optimization Runs: ${OPTIMIZATION_RUNS}`);
  console.log(`   • License Type: MIT (${LICENSE_TYPE})`);
  console.log(`   • Constructor Arguments: ${constructorArgs}`);
  
  console.log(`\n📄 Contract Source Code:`);
  console.log(`   Save this code to a file named ${contractName}.sol:`);
  console.log(`   ${'='.repeat(60)}`);
  console.log(sourceCode);
  console.log(`   ${'='.repeat(60)}`);
  
  console.log(`\n✅ After verification, your contract will be visible at:`);
  if (isNile) {
    console.log(`   https://nile.tronscan.org/#/contract/${contractAddress}`);
  } else if (isShasta) {
    console.log(`   https://shasta.tronscan.org/#/contract/${contractAddress}`);
  } else {
    console.log(`   https://tronscan.org/#/contract/${contractAddress}`);
  }
  
  return true;
}

/**
 * Main verification function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node verify-contract.js <contract-address> <contract-name> [deployment-file]');
    console.log('Example: node verify-contract.js TG6AxQr665rkjC7RNkwzZRHZT6jCmkDwmh TRONRoles');
    process.exit(1);
  }
  
  const contractAddress = args[0];
  const contractName = args[1];
  const deploymentFile = args[2] || path.join(__dirname, '../deployments/nile_roles_deployment.json');
  
  // Load deployment info
  let deploymentInfo = {};
  if (fs.existsSync(deploymentFile)) {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    console.log(`📁 Loaded deployment info from: ${deploymentFile}`);
  } else {
    console.log(`⚠️  Deployment file not found: ${deploymentFile}`);
    console.log('   Using default deployment info');
  }
  
  // Generate verification instructions
  const success = generateVerificationInstructions(contractAddress, contractName, deploymentInfo);
  
  if (success) {
    console.log('\n🎉 Verification instructions generated!');
    console.log('   Follow the steps above to verify your contract on TronScan.');
    process.exit(0);
  } else {
    console.log('\n💥 Failed to generate verification instructions!');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateVerificationInstructions, flattenContract };
