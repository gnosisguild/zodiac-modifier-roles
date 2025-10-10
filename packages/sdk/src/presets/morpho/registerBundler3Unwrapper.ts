import { ChainId } from "zodiac-roles-deployments"
import { addresses } from "./bundler3"
import { Contract, Interface } from "ethers"

const MORPHO_BUNDLER3_UNWRAPPER = "0x9cAfcC440a748000283aF4014818BaB12A072c95"
const MULTICALL_SELECTOR = "0x374f435d"

export const registerBundler3Unwrapper = (
  chainId: ChainId,
  rolesMod: `0x${string}`
): { to: `0x${string}`; data: `0x${string}` } => {
  if (!(chainId in addresses)) {
    throw new Error(
      `Morpho bundler3 unwrapper not supported for chain ${chainId}`
    )
  }

  const bundler3Address = addresses[chainId as keyof typeof addresses].Bundler3

  // ethers v6 Interfaces for encoding
  const peripheryInterface = new Interface([
    "function setTransactionUnwrapper(address to, bytes4 selector, address adapter)",
  ])

  const rolesContract = new Contract(rolesMod, peripheryInterface)
  const data = rolesContract.interface.encodeFunctionData(
    "setTransactionUnwrapper",
    [bundler3Address, MULTICALL_SELECTOR, MORPHO_BUNDLER3_UNWRAPPER]
  ) as `0x${string}`

  return { to: rolesMod, data }
}
