const TRONRoles = artifacts.require('TRONRoles');
const { getAddresses, getAdminRole, getUserRole, getManagerRole } = require('../constants/addresses');

module.exports = async function (deployer, network, accounts) {
  console.log('Deploying TRON Roles module to network:', network);
  
  // Get network configuration
  const networkConfig = getAddresses(network);
  
  // For testing, we'll use the first account as owner, avatar, and target
  // In production, these would be actual Safe addresses
  const owner = accounts[0];
  const avatar = accounts[0]; // This will be replaced with actual Safe address
  const target = accounts[0]; // This will be replaced with actual Safe address
  
  console.log('Deployment parameters:');
  console.log('Owner:', owner);
  console.log('Avatar:', avatar);
  console.log('Target:', target);
  console.log('Network:', network);
  
  await deployer.deploy(TRONRoles, owner, avatar, target);
  
  const rolesInstance = await TRONRoles.deployed();
  console.log('TRON Roles module deployed at:', rolesInstance.address);
  
  // Store deployment info
  const deploymentInfo = {
    network: network,
    rolesAddress: rolesInstance.address,
    owner: owner,
    avatar: avatar,
    target: target,
    deployer: accounts[0],
    explorer: networkConfig.explorer,
    timestamp: new Date().toISOString()
  };
  
  console.log('Deployment completed successfully!');
  console.log('TRON Roles module address:', rolesInstance.address);
  console.log('Explorer URL:', networkConfig.explorer);
  console.log('Contract URL:', `${networkConfig.explorer}/#/contract/${rolesInstance.address}`);
  
  // Log available role keys for reference
  console.log('Available role keys:');
  console.log('ADMIN_ROLE:', getAdminRole());
  console.log('USER_ROLE:', getUserRole());
  console.log('MANAGER_ROLE:', getManagerRole());
  
  return rolesInstance;
};
