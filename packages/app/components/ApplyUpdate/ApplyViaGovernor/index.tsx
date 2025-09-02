import Button from "@/ui/Button"
import { ChainId, decodeKey } from "zodiac-roles-sdk"
import { createPublicClient, http } from "viem"
import { CHAINS } from "@/app/chains"
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
} from "wagmi"
import { ConnectButton } from "@/components/Wallet/ConnectButton"

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

interface Props {
  calls: { to: `0x${string}`; data: `0x${string}` }[]
  owner: `0x${string}`
  roleKey: `0x${string}`
  chainId: ChainId
}

const ApplyViaGovernor: React.FC<Props> = ({
  calls,
  roleKey,
  owner,
  chainId,
}) => {
  const { address } = useAccount()
  const connectedChainId = useChainId()

  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const execute = async () => {
    if (calls.length === 0) return

    // Prepare the proposal data
    const targets = calls.map((call) => call.to)
    const values = calls.map(() => 0n) // All calls have 0 value
    const calldatas = calls.map((call) => call.data)
    const description = `Update permissions of the ${decodeKey(
      roleKey
    )} role. Review the update at ${window.location.href}`

    // Call the governor's propose function
    writeContract({
      address: owner,
      abi: [
        {
          name: "propose",
          type: "function",
          inputs: [
            { name: "targets", type: "address[]" },
            { name: "values", type: "uint256[]" },
            { name: "calldatas", type: "bytes[]" },
            { name: "description", type: "string" },
          ],
          outputs: [{ type: "uint256" }],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "propose",
      args: [targets, values, calldatas, description],
    })
  }

  if (!address || connectedChainId !== chainId) {
    return <ConnectButton chainId={chainId} />
  }

  return (
    <Button
      primary
      onClick={execute}
      disabled={calls.length === 0 || isConfirming || isPending || isSuccess}
    >
      {isPending && "Sign transaction to propose..."}
      {isConfirming && "Waiting for confirmation..."}
      {isSuccess && "Update has been proposed"}

      {!isConfirming &&
        !isPending &&
        !isSuccess &&
        "Propose for Execution via Governor"}
    </Button>
  )
}

export default ApplyViaGovernor
