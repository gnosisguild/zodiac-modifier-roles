import { createPublicClient, http, pad, toHex } from "viem"
import { Interface } from "ethers"
import { rolesAbi } from "zodiac-roles-sdk"
import { CHAINS } from "@/app/chains"
import {
  MULTISEND_141,
  MULTISEND_CALLONLY_141,
  MULTISEND_SELECTOR,
  MULTISEND_UNWRAPPER,
} from "@/components/ApplyUpdate/const"

const LEGACY_UNWRAPPER = "0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0" as const

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const

export type UnwrapperStatus = "correct" | "legacy" | "missing"

export interface UnwrapperEntry {
  address: `0x${string}`
  status: UnwrapperStatus
}

/**
 * Compute the mapping key used in the Periphery `unwrappers` mapping:
 *   bytes32(bytes20(to)) | (bytes32(selector) >> 160)
 */
function unwrapperKey(
  to: `0x${string}`,
  selector: `0x${string}`
): `0x${string}` {
  const toBytes32 = BigInt(pad(to, { size: 32, dir: "right" }))
  const selectorBytes32 = BigInt(pad(selector, { size: 32, dir: "right" }))
  const shifted = selectorBytes32 >> 160n
  return toHex(toBytes32 | shifted, { size: 32 })
}

const unwrappersAbi = [
  {
    name: "unwrappers",
    type: "function",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const

function getStatus(address: `0x${string}`): UnwrapperStatus {
  const lower = address.toLowerCase()
  if (lower === MULTISEND_UNWRAPPER.toLowerCase()) return "correct"
  if (lower === LEGACY_UNWRAPPER.toLowerCase()) return "legacy"
  if (lower === ZERO_ADDRESS) return "missing"
  return "legacy"
}

export async function checkUnwrappers(
  chainId: number,
  rolesAddress: `0x${string}`,
  multiSendAddresses: `0x${string}`[]
): Promise<UnwrapperEntry[]> {
  const addresses: `0x${string}`[] =
    multiSendAddresses.length > 0
      ? multiSendAddresses
      : [MULTISEND_141, MULTISEND_CALLONLY_141]

  const client = createPublicClient({
    chain: CHAINS[chainId as keyof typeof CHAINS],
    transport: http(),
  })

  const results = await client.multicall({
    contracts: addresses.map((addr) => ({
      address: rolesAddress,
      abi: unwrappersAbi,
      functionName: "unwrappers" as const,
      args: [unwrapperKey(addr, MULTISEND_SELECTOR)],
    })),
  })

  return addresses.map((addr, i) => {
    const r = results[i]
    const value =
      r.status === "success"
        ? (r.result as `0x${string}`)
        : (ZERO_ADDRESS as `0x${string}`)
    return { address: addr, status: getStatus(value) }
  })
}

export function getOverallStatus(
  unwrappers: UnwrapperEntry[]
): UnwrapperStatus {
  if (unwrappers.every((u) => u.status === "correct")) return "correct"
  if (unwrappers.some((u) => u.status === "missing")) return "missing"
  return "legacy"
}

type Call = { to: `0x${string}`; data: `0x${string}` }

const rolesInterface = new Interface(rolesAbi)

export function buildSetUnwrapperCalls(
  rolesModifier: `0x${string}`,
  unwrappers: UnwrapperEntry[]
): Call[] {
  return unwrappers
    .filter((u) => u.status !== "correct")
    .map((u) => ({
      to: rolesModifier,
      data: rolesInterface.encodeFunctionData("setTransactionUnwrapper", [
        u.address,
        MULTISEND_SELECTOR,
        MULTISEND_UNWRAPPER,
      ]) as `0x${string}`,
    }))
}
