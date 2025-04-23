"use client"

import Button from "@/ui/Button"
import { useState } from "react"
import { serverApplyPermissions } from "./serverActions"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { parseModParam } from "@/app/params"
import { ChainId } from "zodiac-roles-sdk"
import { createPublicClient, getAddress, http } from "viem"
import { CHAINS } from "@/app/chains"

const Apply: React.FC<{}> = ({}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { mod, role, record } = useParams<{
    mod: string
    role: string
    record: string
  }>()
  const router = useRouter()

  const parsed = parseModParam(mod)
  if (!parsed) {
    return null
  }
  const { chainId, chainPrefix, address } = parsed

  const apply = async () => {
    setIsLoading(true)
    const permissionsHash = await serverApplyPermissions({
      recordId: record,
      chainId,
    })
    const path = `/${mod}/roles/${role}/diff/${permissionsHash}`

    const isInIframe = window.self !== window.top
    if (!isInIframe) {
      // If owned by a Safe redirect to the Safe app
      const ownerSafe = await fetchOwnerSafe(chainId, address)
      if (ownerSafe) {
        window.location.href = `https://app.safe.global/apps/open?safe=${chainPrefix}:${ownerSafe}&appUrl=${encodeURIComponent(
          window.location.origin + path
        )}`
        return
      }
    }

    router.push(`/${mod}/roles/${role}/diff/${permissionsHash}`)
  }

  return (
    <Button primary disabled={isLoading} onClick={apply}>
      {isLoading ? "Preparing permissions..." : "Apply Permissions"}
    </Button>
  )
}

export default Apply

/**
 * Fetch the owner of the given rolesMod.
 * Returns undefined if the rolesMod is not a Safe.
 *
 * This function is memoized to avoid unnecessary RPC calls.
 */
async function fetchOwnerSafe(
  chainId: ChainId,
  roleMod: `0x${string}`
): Promise<`0x${string}` | undefined> {
  const publicClient = createPublicClient({
    chain: CHAINS[chainId],
    transport: http(),
  })
  const owner = await publicClient.readContract({
    address: roleMod,
    abi: [
      {
        inputs: [],
        name: "owner",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "owner",
  })
  const result = (await isSafeAccount(chainId, owner)) ? owner : undefined

  return result
}

const isSafeAccount = async (
  chainId: ChainId,
  address: `0x${string}`
): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://safe-client.safe.global/v1/chains/${chainId}/safes/${getAddress(
        address
      )}`
    )
    return response.ok
  } catch (error) {
    return false
  }
}
