import { getSingletonFactory } from "@gnosis.pm/zodiac/dist/src/factory/singletonFactory"
import hre from "hardhat"

import { Roles } from "../../evm/typechain-types"

export const deployContracts = async (
  owner: string,
  avatar: string,
  target: string
) => {
  const [signer] = await hre.ethers.getSigners()
  const deployer = hre.ethers.provider.getSigner(signer.address)

  // deploy ERC2470 singleton factory
  await getSingletonFactory(deployer)

  // deploy libs
  const Packer = await hre.ethers.getContractFactory("Packer")
  const packer = await Packer.connect(deployer).deploy()

  const Integrity = await hre.ethers.getContractFactory("Integrity")
  const integrity = await Integrity.connect(deployer).deploy()

  // deploy Roles
  const Roles = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Integrity: integrity.address,
      Packer: packer.address,
    },
  })

  const roles = await Roles.deploy(owner, avatar, target)
  return roles as Roles
}
