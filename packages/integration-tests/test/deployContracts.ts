import { deployFactories } from "@gnosis-guild/zodiac-core"
import type { EIP1193Provider } from "@gnosis-guild/zodiac-core"
import type { Signer } from "ethers"
import type { NetworkConnection } from "hardhat/types/network"
import type { EthereumProvider } from "hardhat/types/providers"

import type { Roles } from "../../evm/typechain-types/index.js"

export const deployContracts = async (
  { ethers, provider }: Pick<NetworkConnection, "ethers" | "provider">,
  owner: string,
  avatar: string,
  target: string
) => {
  const [deployer] = await ethers.getSigners()

  await deployFactories({
    provider: createAdapter({ provider, signer: deployer }),
  })

  const ConditionStorer = await ethers.getContractFactory("ConditionStorer")
  const conditionStorer = await ConditionStorer.connect(deployer).deploy()

  const WithinRatioChecker =
    await ethers.getContractFactory("WithinRatioChecker")
  const withinRatioChecker = await WithinRatioChecker.connect(deployer).deploy()

  // deploy Roles
  const Roles = await ethers.getContractFactory("Roles", {
    libraries: {
      ConditionStorer: await conditionStorer.getAddress(),
      WithinRatioChecker: await withinRatioChecker.getAddress(),
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
