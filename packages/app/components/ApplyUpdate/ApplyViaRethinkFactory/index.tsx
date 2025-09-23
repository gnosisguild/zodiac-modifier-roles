import Button from "@/ui/Button"
import { ChainId } from "zodiac-roles-sdk"
import { createPublicClient, http } from "viem"
import { CHAINS } from "@/app/chains"
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
} from "wagmi"
import { POSTER_ADDRESS } from "../const"
import { ConnectButton } from "@/components/Wallet/ConnectButton"

export const isFundInitializing = async ({
  chainId,
  owner,
  rolesModifier,
  connectedWalletAddress,
}: {
  chainId: ChainId
  owner: `0x${string}`
  rolesModifier: `0x${string}`
  connectedWalletAddress: `0x${string}`
}) => {
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
  const code = await client.getCode({ address: owner })
  if (!code) {
    return false // No contract at this address
  }

  try {
    console.log("calling getFundInitializationCache", owner)
    // Try to call the getFundInitializationCache function
    // We use a dummy address (0x0000000000000000000000000000000000000000) as the deployer parameter
    const result = await client.readContract({
      address: owner,
      abi: [
        {
          name: "getFundInitializationCache",
          type: "function",
          inputs: [{ name: "deployer", type: "address" }],
          outputs: [
            {
              type: "tuple",
              components: [
                { name: "fundContractAddr", type: "address" },
                { name: "rolesModifier", type: "address" },
                { name: "fundSettings", type: "tuple" },
                { name: "_fundMetadata", type: "string" },
                { name: "_feePerformancePeriod", type: "uint256" },
                { name: "_feeManagePeriod", type: "uint256" },
              ],
            },
          ],
          stateMutability: "view",
        },
      ],
      functionName: "getFundInitializationCache",
      args: [connectedWalletAddress],
    })
    console.log("result", result)
    // Check if the fund is initializing and connected to our Roles Modifier
    return result.rolesModifier.toLowerCase() === rolesModifier.toLowerCase()
  } catch (error) {
    console.error("isFundInit", error)
    // If call reverts, it's not a Rethink factory
    return false
  }
}

interface Props {
  calls: { to: `0x${string}`; data: `0x${string}` }[]
  owner: `0x${string}`
  chainId: ChainId
}

const ApplyViaRethinkFactory: React.FC<Props> = ({ calls, owner, chainId }) => {
  const { address } = useAccount()
  const connectedChainId = useChainId()

  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const execute = async () => {
    if (calls.length === 0) return

    // Prepare the calldatas array
    const calldatas = calls
      .filter((call) => call.to.toLowerCase() !== POSTER_ADDRESS.toLowerCase()) // Rethink factory does support annotations
      .map((call) => call.data)

    // Call the submitPermissions function
    writeContract({
      address: owner,
      abi: [
        {
          name: "submitPermissions",
          type: "function",
          inputs: [{ name: "calldatas", type: "bytes[]" }],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "submitPermissions",
      args: [calldatas],
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
      {isPending && "Sign transaction to submit..."}
      {isConfirming && "Waiting for confirmation..."}
      {isSuccess && "Permissions submitted"}

      {!isConfirming &&
        !isPending &&
        !isSuccess &&
        "Submit Permissions via Rethink Fund Factory"}
    </Button>
  )
}

export default ApplyViaRethinkFactory
