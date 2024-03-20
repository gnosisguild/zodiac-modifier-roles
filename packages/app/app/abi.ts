import { whatsabi } from "@shazow/whatsabi"
import { ABIFunction } from "@shazow/whatsabi/lib.types/abi"
import throttledQueue from "throttled-queue"
import { AbiFunction, createPublicClient, http } from "viem"
import { unstable_cache } from "next/cache"

import { CHAINS, ChainId } from "./chains"

const ABI_LOADERS = new Map<ChainId, ThrottledEtherscanABILoader>()

export const fetchAbi = unstable_cache(
  async (address: string, chainId: ChainId) => {
    const chain = CHAINS[chainId]
    const client = createPublicClient({
      chain,
      transport: http(),
    })

    if (!ABI_LOADERS.has(chainId)) {
      ABI_LOADERS.set(
        chainId,
        new ThrottledEtherscanABILoader({
          baseURL: chain.blockExplorerAbiUrl,
          apiKey: chain.blockExplorerApiKey,
        })
      )
    }

    const abiLoader = ABI_LOADERS.get(chainId)!

    const result = await whatsabi.autoload(address, {
      provider: client,

      // * Optional loaders:
      abiLoader,
      //   signatureLookup: false, // disable signature lookup

      // * Optional hooks:
      // onProgress: (phase: string) => { ... }
      onError: (phase: string, context: any) => {
        console.error(`Could not fetch ABI for ${chain.prefix}:${address}`, {
          phase,
          context,
        })
      },

      // * Optional settings:
      followProxies: true,
      // enableExperimentalMetadata: false,
    })

    return {
      address: result.address,
      abi: (
        result.abi.filter((item) => item.type === "function") as ABIFunction[]
      ).map(coerceAbiFunction) as AbiFunction[],
    }
  },
  ["abi"],
  { tags: ["abi"] } // cache indefinitely or until revalidateTag('abi') is called
)

const coerceAbiFunction = (abi: ABIFunction): AbiFunction => ({
  ...abi,
  inputs: abi.inputs || [],
  outputs: abi.outputs || [],
  name: abi.name || "",
  stateMutability:
    abi.stateMutability || (abi.payable ? "payable" : "nonpayable"),
})

/** A throttled version of WhatsABI's Etherscan loader queueing requests to avoid hitting rate limits. */
class ThrottledEtherscanABILoader extends whatsabi.loaders.EtherscanABILoader {
  readonly #throttle: <Return = unknown>(
    fn: () => Return | Promise<Return>
  ) => Promise<Return>

  readonly #retries: number

  constructor(
    config?: ConstructorParameters<
      typeof whatsabi.loaders.EtherscanABILoader
    >[0] & {
      requestsPerSeconds?: number
      retries?: number
    }
  ) {
    super(config)
    this.#throttle = throttledQueue(config?.requestsPerSeconds || 5, 1100)
    this.#retries = config?.retries || 3
  }

  override async getContract(
    address: string,
    retries = this.#retries
  ): Promise<whatsabi.loaders.ContractResult> {
    return await this.#throttle(async () => {
      try {
        return await super.getContract(address)
      } catch (e) {
        if (
          (e as any).message.includes("Max rate limit reached") &&
          retries > 0
        ) {
          console.log(
            `Ran into Etherscan rate limit, retrying... (${
              retries - 1
            } retries left)`
          )
          return this.getContract(address, retries - 1)
        }

        throw e
      }
    })
  }

  override async loadABI(address: string, retries = 3): Promise<any[]> {
    return await this.#throttle(async () => {
      try {
        return await super.loadABI(address)
      } catch (e) {
        if (
          (e as any).message.includes("Max rate limit reached") &&
          retries > 0
        ) {
          console.log(
            `Ran into Etherscan rate limit, retrying... (${
              retries - 1
            } retries left)`
          )
          return this.loadABI(address, retries - 1)
        }

        throw e
      }
    })
  }
}
