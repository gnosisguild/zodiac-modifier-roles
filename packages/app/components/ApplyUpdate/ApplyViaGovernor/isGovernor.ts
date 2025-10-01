import { ChainId } from "zodiac-roles-sdk"
import { createPublicClient, http } from "viem"
import { CHAINS } from "@/app/chains"

export const isGovernor = async (chainId: ChainId, address: `0x${string}`) => {
  // Get the chain configuration
  const chain = CHAINS[chainId]
  if (!chain) {
    console.warn(`Chain ${chainId} not found in configuration`)
    return false
  }

  // Create a public client for the chain
  const client = createPublicClient({
    chain,
    transport: http(),
  })

  // First check if there's actually a contract at this address
  const code = await client.getCode({ address })
  if (!code) {
    return false // No contract at this address
  }

  try {
    // Try to call the COUNTING_MODE() function which is common in OpenZeppelin governors
    await client.readContract({
      address,
      abi: [
        {
          name: "COUNTING_MODE",
          type: "function",
          inputs: [],
          outputs: [{ type: "string" }],
          stateMutability: "view",
        },
      ],
      functionName: "COUNTING_MODE",
    })
    return true // If COUNTING_MODE() exists and is callable, it's likely a governor
  } catch (error) {
    // COUNTING_MODE() doesn't exist, so it's not a governor
    return false
  }
}
