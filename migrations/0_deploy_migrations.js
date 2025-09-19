const Migrations = artifacts.require('Migrations');

module.exports = async function (deployer, network, accounts) {
  console.log('Deploying Migrations contract to network:', network);
  
  await deployer.deploy(Migrations);
  
  const migrations = await Migrations.deployed();
  console.log('Migrations contract deployed at:', migrations.address);
  
  return migrations;
};
