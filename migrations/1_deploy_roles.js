const TRONRoles = artifacts.require('TRONRoles');
const { getAddresses, getAdminRole, getUserRole, getManagerRole } = require('../constants/addresses');
const fs = require('fs');
const path = require('path');
const TronWeb = require('tronweb');

module.exports = async function (deployer, network, accounts) {
  console.log('Deploying TRON Roles module to network:', network);
  
  // Get network configuration
  const networkConfig = getAddresses(network);
  
  // Note: In TronBox, 'accounts' is a string, not an array!
  // This is why accounts[0] would give just "T" instead of the full address
  console.log("Deployer:", accounts);
  
  // For testing, we'll use the deployer account as owner, avatar, and target
  // In production, these would be actual Safe addresses
  const owner = accounts;
  const avatar = accounts; // This will be replaced with actual Safe address
  const target = accounts; // This will be replaced with actual Safe address
  
  console.log('Deployment parameters:');
  console.log('Owner:', owner);
  console.log('Avatar:', avatar);
  console.log('Target:', target);
  console.log('Network:', network);
  
  await deployer.deploy(TRONRoles, owner, avatar, target);
  
  const rolesInstance = await TRONRoles.deployed();
  console.log('TRON Roles module deployed at:', rolesInstance.address);
  
  // Convert hex address to TRON address format
  const tronAddress = TronWeb.utils.address.fromHex(rolesInstance.address);
  console.log('TRON address format:', tronAddress);
  
  // Store deployment info
  const deploymentInfo = {
    network: network,
    rolesAddress: tronAddress, // Use TRON address format
    rolesAddressHex: rolesInstance.address, // Keep hex for reference
    owner: owner,
    avatar: avatar,
    target: target,
    deployer: accounts,
    explorer: networkConfig.explorer,
    timestamp: new Date().toISOString(),
    roleKeys: {
      adminRole: getAdminRole(),
      userRole: getUserRole(),
      managerRole: getManagerRole()
    }
  };
  
  // Save deployment info to JSON file
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${network}_roles_deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('Deployment completed successfully!');
  console.log('TRON Roles module address (hex):', rolesInstance.address);
  console.log('TRON Roles module address (TRON):', tronAddress);
  console.log('Explorer URL:', networkConfig.explorer);
  console.log('Contract URL:', `${networkConfig.explorer}/#/contract/${tronAddress}`);
  console.log('Deployment info saved to:', deploymentFile);
  
  // Log available role keys for reference
  console.log('Available role keys:');
  console.log('ADMIN_ROLE:', getAdminRole());
  console.log('USER_ROLE:', getUserRole());
  console.log('MANAGER_ROLE:', getManagerRole());
  
  return rolesInstance;
};
