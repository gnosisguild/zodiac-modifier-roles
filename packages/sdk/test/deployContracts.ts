import hre from "hardhat"

import { Roles } from "../../evm/typechain-types"

export const deployContracts = async (
  owner: string,
  avatar: string,
  target: string
) => {
  const [signer] = await hre.ethers.getSigners()
  const deployer = hre.ethers.provider.getSigner(signer.address)

  const Packer = await hre.ethers.getContractFactory("Packer")
  const packer = await Packer.connect(deployer).deploy()

  const Integrity = await hre.ethers.getContractFactory("Integrity")
  const integrity = await Integrity.connect(deployer).deploy()

  const Roles = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Integrity: integrity.address,
      Packer: packer.address,
    },
  })

  const roles = await Roles.deploy(owner, avatar, target)
  return roles as Roles
}
