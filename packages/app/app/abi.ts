import { AbiFunction } from "viem"

import { ChainId } from "./chains"

export interface ContractInfo {
  address: `0x${string}`
  proxyTo?: `0x${string}`
  verified: boolean
  name?: string
  abi?: AbiFunction[]
}

export const fetchContractInfo = async (
  address: `0x${string}`,
  chainId: ChainId
): Promise<ContractInfo> => {
  const url = `https://api.abi.pub/v1/chains/${chainId}/accounts/${address}`
  const res = await fetch(url, { next: { revalidate: false } })
  if (!res.ok) {
    console.error("Failed to fetch contract info", url, res.status)
    return { address, verified: false }
  }

  const result = await res.json()
  return "proxy" in result
    ? {
        address: result.address,
        proxyTo: result.proxy.target,
        name: result.implementation.name,
        verified: result.implementation.verified,
        abi: result.implementation.abi
          ?.filter((item: PartialAbiFunction) => item.type === "function")
          .map(coerceAbiFunction),
      }
    : {
        address: result.address,
        name: result.name,
        verified: result.verified,
        abi: result.abi
          ?.filter((item: PartialAbiFunction) => item.type === "function")
          .map(coerceAbiFunction),
      }
}

type PartialAbiFunction = {
  type: AbiFunction["type"]
  inputs?: AbiFunction["inputs"]
  outputs?: AbiFunction["outputs"]
  name?: AbiFunction["name"]
  stateMutability: AbiFunction["stateMutability"]
  payable: AbiFunction["payable"]
}

const coerceAbiFunction = (abi: PartialAbiFunction): AbiFunction => ({
  ...abi,
  inputs: abi.inputs || [],
  outputs: abi.outputs || [],
  name: abi.name || "",
  stateMutability:
    abi.stateMutability || (abi.payable ? "payable" : "nonpayable"),
})
