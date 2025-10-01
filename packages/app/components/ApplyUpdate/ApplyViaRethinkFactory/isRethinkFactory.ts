import { CHAINS } from "@/app/chains"
import { createPublicClient, http } from "viem"
import { ChainId } from "zodiac-roles-sdk"

export const isRethinkFactory = async (
  chainId: ChainId,
  address: `0x${string}`
) => {
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
    // Try to call the registeredFundsData function
    await client.readContract({
      address,
      abi: [
        {
          name: "registeredFundsData",
          type: "function",
          inputs: [
            {
              name: "start",
              type: "uint256",
            },
            {
              name: "end",
              type: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "address[]",
            },
            {
              components: [
                {
                  name: "depositFee",
                  type: "uint256",
                },
                {
                  name: "withdrawFee",
                  type: "uint256",
                },
                {
                  name: "performanceFee",
                  type: "uint256",
                },
                {
                  name: "managementFee",
                  type: "uint256",
                },
                {
                  name: "performaceHurdleRateBps",
                  type: "uint256",
                },
                {
                  name: "baseToken",
                  type: "address",
                },
                {
                  name: "safe",
                  type: "address",
                },
                {
                  name: "isExternalGovTokenInUse",
                  type: "bool",
                },
                {
                  name: "isWhitelistedDeposits",
                  type: "bool",
                },
                {
                  name: "allowedDepositAddrs",
                  type: "address[]",
                },
                {
                  name: "allowedManagers",
                  type: "address[]",
                },
                {
                  name: "governanceToken",
                  type: "address",
                },
                {
                  name: "fundAddress",
                  type: "address",
                },
                {
                  name: "governor",
                  type: "address",
                },
                {
                  name: "fundName",
                  type: "string",
                },
                {
                  name: "fundSymbol",
                  type: "string",
                },
                {
                  name: "feeCollectors",
                  type: "address[4]",
                },
              ],
              name: "",
              type: "tuple[]",
            },
          ],
          stateMutability: "view",
        },
      ],
      functionName: "registeredFundsData",
      args: [0n, 0n],
    })
    return true
  } catch (error) {
    return false
  }
}
