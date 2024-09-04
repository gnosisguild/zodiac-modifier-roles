import { deployFactories, EIP1193Provider } from "@gnosis-guild/zodiac-core"
import { Signer } from "ethers"
import hre from "hardhat"
import { EthereumProvider } from "hardhat/types"

import { Roles } from "../../evm/typechain-types"

export const deployContracts = async (
  owner: string,
  avatar: string,
  target: string
) => {
  const [deployer] = await hre.ethers.getSigners()

  await deployFactories({
    provider: createAdapter({
      provider: hre.network.provider,
      signer: deployer,
    }),
  })

  // deploy libs
  const Packer = await hre.ethers.getContractFactory("Packer")
  const packer = await Packer.connect(deployer).deploy()

  const Integrity = await hre.ethers.getContractFactory("Integrity")
  const integrity = await Integrity.connect(deployer).deploy()

  // deploy Roles
  const Roles = await hre.ethers.getContractFactory("Roles", {
    libraries: {
      Integrity: await integrity.getAddress(),
      Packer: await packer.getAddress(),
    },
  })

  const roles = await Roles.deploy(owner, avatar, target)
  return roles as unknown as Roles
}

function createAdapter({
  provider,
  signer,
}: {
  provider: EthereumProvider
  signer: Signer
}): EIP1193Provider {
  return {
    request: async ({ method, params }) => {
      if (method == "eth_sendTransaction") {
        const { hash } = await signer.sendTransaction((params as any[])[0])
        return hash
      }

      return provider.request({ method, params })
    },
  }
}
