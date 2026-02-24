import { fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"
import { createPublicClient, http, pad, toHex } from "viem"

import Layout from "@/components/Layout"
import { parseModParam } from "@/app/params"
import { CHAINS } from "@/app/chains"
import PageBreadcrumbs from "../breadcrumbs"
import {
  MULTISEND_141,
  MULTISEND_CALLONLY_141,
  MULTISEND_SELECTOR,
  MULTISEND_UNWRAPPER,
} from "@/components/ApplyUpdate/const"
import { isGovernor } from "@/components/ApplyUpdate/ApplyViaGovernor/isGovernor"
import { isRethinkFactory } from "@/components/ApplyUpdate/ApplyViaRethinkFactory/isRethinkFactory"
import MultisendStatus from "./MultisendStatus"

const LEGACY_UNWRAPPER = "0x93B7fCbc63ED8a3a24B59e1C3e6649D50B7427c0" as const

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const

/**
 * Compute the mapping key used in the Periphery `unwrappers` mapping:
 *   bytes32(bytes20(to)) | (bytes32(selector) >> 160)
 */
function unwrapperKey(
  to: `0x${string}`,
  selector: `0x${string}`
): `0x${string}` {
  // bytes32(bytes20(to)) — address in high bytes, right-padded with zeros
  const toBytes32 = BigInt(pad(to, { size: 32, dir: "right" }))
  // bytes32(selector) >> 160 — selector right-padded then shifted into bytes 20-23
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

async function fetchUnwrappers(
  chainId: number,
  rolesAddress: `0x${string}`,
  multisendAddresses: `0x${string}`[]
): Promise<`0x${string}`[]> {
  const client = createPublicClient({
    chain: CHAINS[chainId as keyof typeof CHAINS],
    transport: http(),
  })

  const results = await client.multicall({
    contracts: multisendAddresses.map((addr) => ({
      address: rolesAddress,
      abi: unwrappersAbi,
      functionName: "unwrappers" as const,
      args: [unwrapperKey(addr, MULTISEND_SELECTOR)],
    })),
  })

  return results.map((r) =>
    r.status === "success"
      ? (r.result as `0x${string}`)
      : ("0x0000000000000000000000000000000000000000" as `0x${string}`)
  )
}

export type UnwrapperStatus = "correct" | "legacy" | "missing"

function getStatus(address: `0x${string}`): UnwrapperStatus {
  const lower = address.toLowerCase()
  if (lower === MULTISEND_UNWRAPPER.toLowerCase()) return "correct"
  if (lower === LEGACY_UNWRAPPER.toLowerCase()) return "legacy"
  if (lower === ZERO_ADDRESS) return "missing"
  // Any other address is treated as legacy/outdated
  return "legacy"
}

export default async function MultisendPage(props: {
  params: Promise<{ mod: string }>
}) {
  const params = await props.params
  const mod = parseModParam(params.mod)

  if (!mod) {
    notFound()
  }

  const modInfo = await fetchRolesMod(mod)
  if (!modInfo) {
    notFound()
  }

  const addresses: `0x${string}`[] =
    modInfo.multiSendAddresses.length > 0
      ? modInfo.multiSendAddresses
      : [MULTISEND_141, MULTISEND_CALLONLY_141]

  const results = await fetchUnwrappers(mod.chainId, mod.address, addresses)

  const unwrappers = addresses.map((addr, i) => ({
    address: addr,
    status: getStatus(results[i]),
  }))

  const overallStatus: UnwrapperStatus = unwrappers.every(
    (u) => u.status === "correct"
  )
    ? "correct"
    : unwrappers.some((u) => u.status === "missing")
      ? "missing"
      : "legacy"

  let applyType: "safe" | "governor" | "rethink" = "safe"
  if (overallStatus !== "correct") {
    if (await isGovernor(mod.chainId, modInfo.owner)) applyType = "governor"
    else if (await isRethinkFactory(mod.chainId, modInfo.owner))
      applyType = "rethink"
  }

  return (
    <Layout head={<PageBreadcrumbs mod={mod} />}>
      <main>
        <MultisendStatus
          unwrappers={unwrappers}
          overallStatus={overallStatus}
          rolesAddress={mod.address}
          owner={modInfo.owner}
          chainId={mod.chainId}
          applyType={applyType}
        />
      </main>
    </Layout>
  )
}
