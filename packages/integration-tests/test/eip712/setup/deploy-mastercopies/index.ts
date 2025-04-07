import hre from "hardhat";

import { deployFactory as deploy2470Factory } from "./eip2470";
import { deployFallbackHandler } from "./fallbackHandler";
import { deployModuleProxyFactory } from "./moduleProxyFactory";
import { deployRolesMastercopy } from "./rolesMastercopy";
import { deploySafeMastercopy } from "./safeMastercopy";
import { deploySafeProxyFactory } from "./safeProxyFactory";
import { deployFactory } from "./singletonFactory";

export default async function deployMastercopies() {
  const [, , , , , , deployer] = await hre.ethers.getSigners();

  await deployFactory(deployer);
  await deploy2470Factory(deployer);
  await deployModuleProxyFactory(deployer);
  await deployFallbackHandler(deployer);
  await deploySafeMastercopy(deployer);
  await deploySafeProxyFactory(deployer);
  await deployRolesMastercopy(deployer);
}
