"use client"
import { AbiFunction } from "viem"
import { useReducer } from "react"

import { Call } from "@/app/api/records/types"
import CallTable from "./CallTable"
import {
  serverLabelCall,
  serverDeleteCall,
  serverToggleWildcard,
  serverAddCall,
} from "../serverActions"
import { CallState } from "./types"
import { invariant } from "@epic-web/invariant"
import { useCopyModal } from "../CopyModal"

interface Props {
  recordId: string
  targetSelector: string // <to>:<selector>
  abi: AbiFunction
  calls: Call[]
  wildcards: { [paramPath: string]: boolean | undefined }
  isAuthorized: boolean
}

const InteractiveCallTable: React.FC<Props> = ({
  recordId,
  targetSelector,
  calls: initialCalls,
  wildcards: initialWildcards,
  abi,
  isAuthorized,
}) => {
  const [calls, updateCall] = useReducer(handleUpdateCallAction, initialCalls)
  const [wildcards, updateWildcard] = useReducer(
    handleUpdateWildcardAction,
    initialWildcards
  )

  const { modal: copyModal, open: openCopyModal } = useCopyModal(recordId)

  const handleWildcardToggle = async (
    paramPath: string,
    isWildcarded: boolean
  ) => {
    if (!isAuthorized) {
      openCopyModal()
      return
    }
    updateWildcard({ paramPath, isWildcarded })
    await serverToggleWildcard({
      recordId,
      targetSelector,
      paramPath,
      isWildcarded,
    })
  }

  const handleLabelEdit = async (callId: string, label: string) => {
    if (!isAuthorized) {
      openCopyModal()
      return
    }
    updateCall({ action: "label", callId, label })
    await serverLabelCall({
      recordId,
      callId,
      label,
    })
  }

  const handleDelete = async (callId: string) => {
    if (!isAuthorized) {
      openCopyModal()
      return
    }
    updateCall({ action: "delete", callId })
    await serverDeleteCall({
      recordId,
      callId,
    })
  }

  const handleRestore = async (callId: string) => {
    if (!isAuthorized) {
      openCopyModal()
      return
    }
    updateCall({ action: "restore", callId })
    const callState = calls.find((call) => call.id === callId)
    invariant(callState != null, "call not found")
    const { deleted, ...call } = callState
    await serverAddCall({
      recordId,
      call,
    })
  }

  return (
    <>
      {copyModal}
      <CallTable
        calls={calls}
        wildcards={wildcards}
        abi={abi}
        onWildcardToggle={handleWildcardToggle}
        onLabelEdit={handleLabelEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />
    </>
  )
}

export default InteractiveCallTable

type UpdateCallAction =
  | {
      action: "delete"
      callId: string
    }
  | {
      action: "restore"
      callId: string
    }
  | {
      action: "label"
      callId: string
      label: string
    }

function handleUpdateCallAction(calls: CallState[], action: UpdateCallAction) {
  switch (action.action) {
    case "delete":
      return calls.map((call) =>
        call.id === action.callId ? { ...call, deleted: true } : call
      )
    case "restore":
      return calls.map((call) =>
        call.id === action.callId ? { ...call, deleted: false } : call
      )
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
