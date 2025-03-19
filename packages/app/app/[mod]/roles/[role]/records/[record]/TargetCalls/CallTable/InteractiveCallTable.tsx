import { AbiFunction } from "viem"

import { Call, Record } from "@/app/api/records/types"
import CallTable from "./CallTable"
import { useEffect, useRef, useState } from "react"
import { kv } from "@vercel/kv"

async function updateRecord(record: Record) {
  "use server"
  // TODO authentication!?!?!?
  await kv.set(record.id, {
    ...record,
    lastUpdatedAt: new Date().toISOString(),
  })
}

interface Props {
  record: Record
  abi: AbiFunction
}

const InteractiveCallTable: React.FC<Props> = ({ record, abi }) => {
  const [recordState, setRecordState] = useState(record)

  // automatically save the record when it changes
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) {
      updateRecord(recordState)
    }
    mounted.current = true
  }, [recordState])

  const handleScopeToggle = async (paramPath: string, isScoped: boolean) => {
    setRecordState((state) => updateWildcard(state, paramPath, isScoped))
    console.log("scope toggle", paramPath, isScoped)
  }

  const handleLabelEdit = async (callIndex: number, newLabel: string) => {
    setRecordState((state) => labelCall(state, callIndex, newLabel))
    console.log("label edit", callIndex, newLabel)
  }

  const handleDelete = async (callIndex: number) => {
    setRecordState((state) => deleteCall(state, callIndex))
    console.log("delete", callIndex)
  }

  return (
    <CallTable
      calls={recordState.calls}
      wildcards={recordState.wildcards}
      abi={abi}
      onScopeToggle={handleScopeToggle}
      onLabelEdit={handleLabelEdit}
      onDelete={handleDelete}
    />
  )
}

export default InteractiveCallTable

function deleteCall(record: Record, callIndex: number) {
  return {
    ...record,
    calls: record.calls.filter((_, index) => index !== callIndex),
    lastUpdatedAt: new Date().toISOString(),
  }
}

function labelCall(record: Record, callIndex: number, label: string) {
  return {
    ...record,
    calls: record.calls.map((call, index) =>
      index === callIndex
        ? { ...call, metadata: { ...call.metadata, label } }
        : call
    ),
  }
}

function updateWildcard(
  record: Record,
  paramPath: string,
  isWildcard: boolean
) {
  if (isWildcard && !record.wildcards.includes(paramPath)) {
    return {
      ...record,
      wildcards: [...record.wildcards, paramPath],
    }
  }

  if (!isWildcard && record.wildcards.includes(paramPath)) {
    return {
      ...record,
      wildcards: record.wildcards.filter((path) => path !== paramPath),
    }
  }

  return record
}
