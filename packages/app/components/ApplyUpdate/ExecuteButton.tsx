"use client"

import { useState } from "react"
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk"
import { RiCheckboxCircleLine } from "react-icons/ri"

import Button from "@/ui/Button"
import Spinner from "@/ui/Spinner"
import Flex from "@/ui/Flex"

interface Call {
  to: `0x${string}`
  data: `0x${string}`
}

enum State {
  Initial,
  Pending,
  Queued,
  Executed,
}

const ExecuteButton: React.FC<{ owner: `0x${string}`; calls: Call[] }> = ({
  owner,
  calls,
}) => {
  const { sdk, connected, safe } = useSafeAppsSDK()
  const [state, setState] = useState(State.Initial)

  // only show execute button the connected Safe is the owner of the Roles mod
  if (!connected) return null
  if (safe.safeAddress.toLowerCase() !== owner.toLowerCase()) return null

  const execute = async () => {
    setState(State.Pending)

    let safeTxHash: string
    try {
      const res = await sdk.txs.send({
        txs: calls.map((call) => ({ ...call, value: "0" })),
      })
      safeTxHash = res.safeTxHash
    } catch (e) {
      console.error("Error executing calls to apply permission updates", e)
      setState(State.Initial)
      return
    }

    const tx = await sdk.txs.getBySafeTxHash(safeTxHash)
    switch (tx.txStatus) {
      case "AWAITING_CONFIRMATIONS":
      case "AWAITING_EXECUTION":
        setState(State.Queued)
        break
      case "SUCCESS":
        setState(State.Executed)
        break
      default:
        setState(State.Initial)
    }
  }

  return (
    <>
      {state === State.Initial && (
        <Button
          onClick={execute}
          disabled={calls.length === 0 || state === State.Initial}
        >
          Execute
        </Button>
      )}
      {state === State.Queued && (
        <Flex gap={2}>
          <Spinner /> <span>Waiting for confirmation...</span>
        </Flex>
      )}
      {state === State.Executed && (
        <Flex gap={2}>
          <RiCheckboxCircleLine /> <span>Update has been applied</span>
        </Flex>
      )}
    </>
  )
}

export default ExecuteButton
