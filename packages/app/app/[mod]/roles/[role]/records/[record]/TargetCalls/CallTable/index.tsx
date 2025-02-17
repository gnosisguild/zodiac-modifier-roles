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
import classes from "./style.module.css"

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  abi: AbiFunction
  calls: Call[]
}

const HEADER_HEIGHT = 48
const ROW_HEIGHT = 44

const CallTable: React.FC<Props> = ({ calls, abi }) => {
  const colDefs = columnDefs(abi.inputs, "inputs.")
  console.log({
    colDefs,
    rowData: rowData(calls, abi),
    maxNesting: maxNesting(colDefs),
  })
  return (
    <div
      className={classes.table}
      style={{
        height: calls.length * ROW_HEIGHT + maxNesting(colDefs) * HEADER_HEIGHT,
      }}
    >
      <AgGridReact columnDefs={colDefs} rowData={rowData(calls, abi)} />
    </div>
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
        spanRows: true,
        children: columnDefs(input.components, prefix + name + "."),
      }
    } else {
      return { headerName: name, field: prefix + name, spanRows: true }
    }
  })
}

const rowData = (calls: Call[], abi: AbiFunction) => {
  const decodedCalls = calls.map((call) => {
    const { args } = decodeFunctionData({ abi: [abi], data: call.data })

    return {
      inputs: Object.fromEntries(
        abi.inputs.map((input, index) => [input.name, args[index]])
      ),
      value: call.value,
      operation: call.operation,
      metadata: call.metadata,
    }
  })

  return decodedCalls
}

const maxNesting = (
  colDefs: (ColDef<any, any> | ColGroupDef<any>)[]
): number => {
  return colDefs.reduce((max, colDef) => {
    if ("children" in colDef) {
      return Math.max(max, maxNesting(colDef.children) + 1)
    }
    return max
  }, 1)
}
