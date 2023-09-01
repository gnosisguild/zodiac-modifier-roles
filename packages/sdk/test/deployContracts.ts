import { parseEther } from "ethers/lib/utils"
import hre from "hardhat"

import { Roles } from "../../evm/typechain-types"

export const deployContracts = async (
  owner: string,
  avatar: string,
  target: string
) => {
  const [signer] = await hre.ethers.getSigners()
  const deployer = hre.ethers.provider.getSigner(signer.address)

  await deployERC2470SingletonFactory()

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

/**
 * Deploy the ERC-2470 singleton factory on networks where it doesn't exist yet.
 */
const deployERC2470SingletonFactory = async () => {
  const [signer] = await hre.ethers.getSigners()
  await signer.sendTransaction({
    to: "0xBb6e024b9cFFACB947A71991E386681B1Cd1477D",
    value: parseEther("0.0247"),
  })
  if (!signer.provider) throw new Error("No provider")

  await signer.provider?.sendTransaction(
    "0xf9016c8085174876e8008303c4d88080b90154608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80634af63f0214602d575b600080fd5b60cf60048036036040811015604157600080fd5b810190602081018135640100000000811115605b57600080fd5b820183602082011115606c57600080fd5b80359060200191846001830284011164010000000083111715608d57600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925060eb915050565b604080516001600160a01b039092168252519081900360200190f35b6000818351602085016000f5939250505056fea26469706673582212206b44f8a82cb6b156bfcc3dc6aadd6df4eefd204bc928a4397fd15dacf6d5320564736f6c634300060200331b83247000822470"
  )
}
