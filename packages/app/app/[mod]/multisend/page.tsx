import { fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"
import { createPublicClient, http, pad, toHex } from "viem"

import Layout from "@/components/Layout"
import { parseModParam, parseRoleParam } from "@/app/params"
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

async function fetchUnwrapper(
  chainId: number,
  rolesAddress: `0x${string}`,
  multisendAddress: `0x${string}`
): Promise<`0x${string}`> {
  const client = createPublicClient({
    chain: CHAINS[chainId as keyof typeof CHAINS],
    transport: http(),
  })

  const key = unwrapperKey(multisendAddress, MULTISEND_SELECTOR)

  const result = await client.readContract({
    address: rolesAddress,
    abi: [
      {
        name: "unwrappers",
        type: "function",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
      },
    ] as const,
    functionName: "unwrappers",
    args: [key],
  })

  return result as `0x${string}`
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
  params: Promise<{ mod: string; role: string }>
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

  const [unwrapper141, unwrapperCallOnly141] = await Promise.all([
    fetchUnwrapper(mod.chainId, mod.address, MULTISEND_141),
    fetchUnwrapper(mod.chainId, mod.address, MULTISEND_CALLONLY_141),
  ])

  const status141 = getStatus(unwrapper141)
  const statusCallOnly141 = getStatus(unwrapperCallOnly141)

  // Determine the overall status — worst of the two
  const overallStatus: UnwrapperStatus =
    status141 === "correct" && statusCallOnly141 === "correct"
      ? "correct"
      : status141 === "missing" || statusCallOnly141 === "missing"
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
          status141={status141}
          statusCallOnly141={statusCallOnly141}
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
