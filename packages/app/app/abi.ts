import throttledQueue from "throttled-queue"
import { AbiFunction, createPublicClient, http } from "viem"
import detectProxyTarget from "evm-proxy-detection"
import { unstable_cache } from "next/cache"

import { CHAINS, ChainId } from "./chains"

const ABI_LOADERS = new Map<ChainId, ThrottledEtherscanAbiLoader>()

export const fetchAbi = unstable_cache(
  async (address: string, chainId: ChainId) => {
    const chain = CHAINS[chainId]
    const client = createPublicClient({
      chain,
      batch: {
        multicall: true,
      },
      transport: http(),
    })

    if (!ABI_LOADERS.has(chainId)) {
      ABI_LOADERS.set(
        chainId,
        new ThrottledEtherscanAbiLoader({
          baseURL: chain.blockExplorerAbiUrl,
          apiKey: chain.blockExplorerApiKey,
        })
      )
    }

    const abiLoader = ABI_LOADERS.get(chainId)!
    const target = await detectProxyTarget(address, client.request as any)
    const contractInfo = await abiLoader.getContract(target || address)

    return {
      address: target || address,
      name: contractInfo?.name || "",
      abi: contractInfo?.abi
        .filter((item: PartialAbiFunction) => item.type === "function")
        .map(coerceAbiFunction),
    }
  },
  ["abi"],
  { tags: ["abi"] } // cache indefinitely or until revalidateTag('abi') is called
)

type PartialAbiFunction = {
  type: AbiFunction["type"]
  inputs?: AbiFunction["inputs"]
  outputs?: AbiFunction["outputs"]
  name?: AbiFunction["name"]
  stateMutability: AbiFunction["stateMutability"]
  payable: AbiFunction["payable"]
}

interface ContractInfo {
  name: string
  abi: PartialAbiFunction[]
}

const coerceAbiFunction = (abi: PartialAbiFunction): AbiFunction => ({
  ...abi,
  inputs: abi.inputs || [],
  outputs: abi.outputs || [],
  name: abi.name || "",
  stateMutability:
    abi.stateMutability || (abi.payable ? "payable" : "nonpayable"),
})

// based on: https://github.com/shazow/whatsabi/blob/45e055ce9f89e4b4e35db6ed5133083c93dfc482/src/loaders.ts
// Copyright (c) 2022 Andrey Petrov, released under MIT License
export class EtherscanAbiLoader {
  apiKey?: string
  baseURL: string

  constructor(config?: { apiKey?: string; baseURL?: string }) {
    if (config === undefined) config = {}
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL || "https://api.etherscan.io/api"
  }

  async getContract(address: string): Promise<ContractInfo | null> {
    let url =
      this.baseURL + "?module=contract&action=getsourcecode&address=" + address
    if (this.apiKey) url += "&apikey=" + this.apiKey

    const r = await fetchJson(url)
    if (r.status === "0") {
      if (r.result === "Contract source code not verified") return null
      throw new Error("Etherscan error: " + r.result)
    }

    const result = r.result[0]
    return {
      abi: JSON.parse(result.ABI),
      name: result.ContractName,
    }
  }
}

/** A throttled version of WhatsABI's Etherscan loader queueing requests to avoid hitting rate limits. */
class ThrottledEtherscanAbiLoader extends EtherscanAbiLoader {
  readonly #throttle: <Return = unknown>(
    fn: () => Return | Promise<Return>
  ) => Promise<Return>

  readonly #retries: number

  constructor(
    config?: ConstructorParameters<typeof EtherscanAbiLoader>[0] & {
      requestsPerSeconds?: number
      retries?: number
    }
  ) {
    super(config)
    this.#throttle = throttledQueue(config?.requestsPerSeconds || 5, 1100, true)
    this.#retries = config?.retries || 3
  }

  override async getContract(
    address: string,
    retries = this.#retries
  ): Promise<ContractInfo | null> {
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
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 },
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return await response.json()
}
