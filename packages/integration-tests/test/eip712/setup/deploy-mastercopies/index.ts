import type { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types"

import { deployFactory as deploy2470Factory } from "./eip2470.js"
import { deployFallbackHandler } from "./fallbackHandler.js"
import { deployModuleProxyFactory } from "./moduleProxyFactory.js"
import { deployRolesMastercopy } from "./rolesMastercopy.js"
import { deploySafeMastercopy } from "./safeMastercopy.js"
import {
  deploySafeProxyFactory,
  address as safeProxyFactory,
} from "./safeProxyFactory.js"
import { deployFactory } from "./singletonFactory.js"

export default async function deployMastercopies(ethers: HardhatEthers) {
  const [, , , , , , deployer] = await ethers.getSigners()

  if ((await deployer.provider!.getCode(safeProxyFactory)) != "0x") {
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
