"use client"
import Button from "@/ui/Button"
import { ChainId } from "zodiac-roles-sdk"
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useReadContract,
  useDisconnect,
} from "wagmi"
import { POSTER_ADDRESS } from "../const"
import { ConnectButton } from "@/components/Wallet/ConnectButton"

export const useIsFundInitializing = ({
  chainId,
  owner,
  rolesModifier,
}: {
  chainId: ChainId
  owner: `0x${string}`
  rolesModifier: `0x${string}`
}) => {
  const { address } = useAccount()

  const { data, error, isLoading } = useReadContract({
    address: owner,
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "deployer",
            type: "address",
          },
        ],
        name: "getFundInitializationCache",
        outputs: [
          {
            components: [
              {
                internalType: "address",
                name: "fundContractAddr",
                type: "address",
              },
              {
                internalType: "address",
                name: "rolesModifier",
                type: "address",
              },
              {
                components: [
                  {
                    internalType: "uint256",
                    name: "depositFee",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "withdrawFee",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "performanceFee",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "managementFee",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "performaceHurdleRateBps",
                    type: "uint256",
                  },
                  {
                    internalType: "address",
                    name: "baseToken",
                    type: "address",
                  },
                  {
                    internalType: "address",
                    name: "safe",
                    type: "address",
                  },
                  {
                    internalType: "bool",
                    name: "isExternalGovTokenInUse",
                    type: "bool",
                  },
                  {
                    internalType: "bool",
                    name: "isWhitelistedDeposits",
                    type: "bool",
                  },
                  {
                    internalType: "address[]",
                    name: "allowedDepositAddrs",
                    type: "address[]",
                  },
                  {
                    internalType: "address[]",
                    name: "allowedManagers",
                    type: "address[]",
                  },
                  {
                    internalType: "address",
                    name: "governanceToken",
                    type: "address",
                  },
                  {
                    internalType: "address",
                    name: "fundAddress",
                    type: "address",
                  },
                  {
                    internalType: "address",
                    name: "governor",
                    type: "address",
                  },
                  {
                    internalType: "string",
                    name: "fundName",
                    type: "string",
                  },
                  {
                    internalType: "string",
                    name: "fundSymbol",
                    type: "string",
                  },
                  {
                    internalType: "address[4]",
                    name: "feeCollectors",
                    type: "address[4]",
                  },
                ],
                internalType: "struct IGovernableFundStorage.Settings",
                name: "fundSettings",
                type: "tuple",
              },
              {
                internalType: "string",
                name: "_fundMetadata",
                type: "string",
              },
              {
                internalType: "uint256",
                name: "_feePerformancePeriod",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "_feeManagePeriod",
                type: "uint256",
              },
            ],
            internalType: "struct GovernableFundFactory.InitializationCache",
            name: "",
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      ,
    ],
    functionName: "getFundInitializationCache",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId,
    query: {
      enabled: !!address,
    },
  })

  // Check if the fund is initializing and connected to our Roles Modifier
  const isInitializing =
    data &&
    (data as any).rolesModifier.toLowerCase() === rolesModifier.toLowerCase()

  if (error) {
    console.error("Error checking if fund is initializing", error)
  }

  return {
    isInitializing: !!isInitializing,
    isChecking: isLoading,
  }
}

interface Props {
  calls: { to: `0x${string}`; data: `0x${string}` }[]
  owner: `0x${string}`
  rolesModifier: `0x${string}`
  chainId: ChainId
}

const ApplyViaRethinkFactory: React.FC<Props> = ({
  calls,
  owner,
  chainId,
  rolesModifier,
}) => {
  const { address } = useAccount()
  const connectedChainId = useChainId()
  const { disconnect } = useDisconnect()

  const { isInitializing, isChecking } = useIsFundInitializing({
    chainId,
    owner,
    rolesModifier,
  })

  const { writeContract, data: hash, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const execute = async () => {
    if (calls.length === 0) return

    // Prepare the calldatas array
    const calldatas = calls
      .filter((call) => call.to.toLowerCase() !== POSTER_ADDRESS.toLowerCase()) // Rethink factory doesn't support annotations
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

  if (calls.length === 0) {
    return null
  }

  if (address && !isInitializing) {
    // connected wallet is not the fund initializer
    return (
      <Button primary onClick={() => disconnect()}>
        Switch your wallet to the fund initializer
      </Button>
    )
  }

  if (!address || connectedChainId !== chainId) {
    return <ConnectButton chainId={chainId} />
  }

  if (isChecking) {
    return null
  }

  return (
    <Button
      primary
      onClick={execute}
      disabled={!isInitializing || isConfirming || isPending || isSuccess}
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
