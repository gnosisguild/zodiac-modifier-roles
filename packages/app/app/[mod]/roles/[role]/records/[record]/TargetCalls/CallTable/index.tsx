"use client"
import { AbiFunction } from "viem"
import { useOptimistic } from "react"

import { Call } from "@/app/api/records/types"
import CallTable from "./CallTable"
import { serverToggleWildcard } from "./serverActions"

interface Props {
  recordId: string
  targetSelector: string // <to>:<selector>
  abi: AbiFunction
  calls: Call[]
  wildcards: { [paramPath: string]: boolean | undefined }
}

const InteractiveCallTable: React.FC<Props> = ({
  recordId,
  targetSelector,
  calls,
  wildcards,
  abi,
}) => {
  const [optimisticCalls, updateCall] = useOptimistic(
    calls,
    handleUpdateCallAction
  )
  const [optimisticWildcards, updateWildcard] = useOptimistic(
    wildcards,
    handleUpdateWildcardAction
  )

  const handleWildcardToggle = async (
    paramPath: string,
    isWildcarded: boolean
  ) => {
    updateWildcard({ paramPath, isWildcarded })
    console.log("wildcard toggle", paramPath, isWildcarded)
    await serverToggleWildcard({
      recordId,
      targetSelector,
      paramPath,
      isWildcarded,
    })
    console.log("wildcard toggle done", paramPath, isWildcarded)
  }

  const handleLabelEdit = (callId: string, label: string) => {
    updateCall({ action: "label", callId, label })
    console.log("label edit", callId, label)
  }

  const handleDelete = (callId: string) => {
    updateCall({ action: "delete", callId })
    console.log("delete", callId)
  }

  console.log("optimisticWildcards", optimisticWildcards, { wildcards })

  return (
    <CallTable
      calls={optimisticCalls}
      wildcards={optimisticWildcards}
      abi={abi}
      onWildcardToggle={handleWildcardToggle}
      onLabelEdit={handleLabelEdit}
      onDelete={handleDelete}
    />
  )
}

export default InteractiveCallTable

type UpdateCallAction =
  | {
      action: "delete"
      callId: string
    }
  | {
      action: "label"
      callId: string
      label: string
    }

function handleUpdateCallAction(calls: Call[], action: UpdateCallAction) {
  switch (action.action) {
    case "delete":
      return calls.filter((call) => call.id !== action.callId)
    case "label":
      return calls.map((call) =>
        call.id === action.callId
          ? { ...call, metadata: { ...call.metadata, label: action.label } }
          : call
      )
  }
}

function handleUpdateWildcardAction(
  wildcards: { [paramPath: string]: boolean | undefined },
  action: { paramPath: string; isWildcarded: boolean }
) {
  return {
    ...wildcards,
    [action.paramPath]: action.isWildcarded,
  }
}
