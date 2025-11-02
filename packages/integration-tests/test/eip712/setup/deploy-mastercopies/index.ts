import hre from "hardhat"

import { deployFactory as deploy2470Factory } from "./eip2470"
import { deployFallbackHandler } from "./fallbackHandler"
import { deployModuleProxyFactory } from "./moduleProxyFactory"
import { deployRolesMastercopy } from "./rolesMastercopy"
import { deploySafeMastercopy } from "./safeMastercopy"
import {
  deploySafeProxyFactory,
  address as rolesMastercopyAddress,
} from "./safeProxyFactory"
import { deployFactory } from "./singletonFactory"

export default async function deployMastercopies() {
  const [, , , , , , deployer] = await hre.ethers.getSigners()

  if ((await deployer.provider.getCode(rolesMastercopyAddress)) != "0x") {
    return
  }

  await deployFactory(deployer)
  await deploy2470Factory(deployer)
  await deployModuleProxyFactory(deployer)
  await deployFallbackHandler(deployer)
  await deploySafeMastercopy(deployer)
  await deploySafeProxyFactory(deployer)
  await deployRolesMastercopy(deployer)
}
