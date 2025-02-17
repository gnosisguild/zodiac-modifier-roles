"use client"
import { AgGridReact } from "ag-grid-react"
import {
  ModuleRegistry,
  AllCommunityModule,
  ColDef,
  ColGroupDef,
} from "ag-grid-community"
import { AbiFunction, AbiParameter, decodeFunctionData } from "viem"
import { Call } from "@/app/api/records/types"
import { c } from "zodiac-roles-sdk"

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  abi: AbiFunction
  calls: Call[]
}

const CallTable: React.FC<Props> = ({ calls, abi }) => {
  return (
    <AgGridReact
      columnDefs={columnDefs(abi.inputs, "args.")}
      rowData={rowData(calls, abi)}
    />
  )
}

export default CallTable

const columnDefs = (
  inputs: readonly AbiParameter[],
  prefix: string = ""
): (ColDef<any, any> | ColGroupDef<any>)[] => {
  return inputs.map((input, index) => {
    const isArray = input.type.endsWith("]")
    const isTuple = !isArray && input.type === "tuple" && "components" in input
    const name = input.name ?? `[${index}]`

    if (isTuple) {
      // represent as column group
      return {
        headerName: name,
        field: prefix + name,
        children: columnDefs(input.components, prefix + name + "."),
      }
    } else {
      return { headerName: name, field: prefix + name }
    }
  })
}

const rowData = (calls: Call[], abi: AbiFunction) => {
  const decodedCalls = calls.map((call) => {
    const { args } = decodeFunctionData({ abi: [abi], data: call.data })
    return {
      args,
      value: call.value,
      operation: call.operation,
      metadata: call.metadata,
    }
  })

  return decodedCalls
}
