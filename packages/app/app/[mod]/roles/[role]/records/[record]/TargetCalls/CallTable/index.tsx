"use client"
import { AbiFunction } from "viem"

import { Call } from "@/app/api/records/types"
import CallTable from "./CallTable"

interface Props {
  abi: AbiFunction
  calls: Call[]
}

const InteractiveCallTable: React.FC<Props> = ({ calls, abi }) => {
  const handleScopeToggle = (paramPath: string, isScoped: boolean) => {
    console.log(paramPath, isScoped)
  }

  const handleLabelEdit = (callIndex: number, newLabel: string) => {
    console.log("label edit", callIndex, newLabel)
  }

  const handleDelete = (callIndex: number) => {
    console.log("delete", callIndex)
  }

  return (
    <CallTable
      calls={calls}
      abi={abi}
      onScopeToggle={handleScopeToggle}
      onLabelEdit={handleLabelEdit}
      onDelete={handleDelete}
    />
  )
}

export default InteractiveCallTable
