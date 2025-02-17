"use client"
import { AgGridReact } from "ag-grid-react"
import {
  ModuleRegistry,
  AllCommunityModule,
  ColDef,
  ColGroupDef,
} from "ag-grid-community"
import { invariant } from "@epic-web/invariant"
import { AbiFunction, AbiParameter, decodeFunctionData } from "viem"
import { Call } from "@/app/api/records/types"
import classes from "./style.module.css"
import { arrayElementType } from "@/utils/abi"

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  abi: AbiFunction
  calls: Call[]
}

const HEADER_HEIGHT = 48
const LINE_HEIGHT = 44

const CallTable: React.FC<Props> = ({ calls, abi }) => {
  const cols = columnDefs(abi.inputs, "inputs.")
  const rows = rowData(calls, abi)
  const totalLines = rows.reduce((sum, row) => sum + row.lines, 0)
  console.log({
    cols,
    rows,
    totalLines,
    maxNesting: maxNesting(cols),
  })

  return (
    <div
      className={classes.table}
      style={{
        height: totalLines * LINE_HEIGHT + maxNesting(cols) * HEADER_HEIGHT,
      }}
    >
      <AgGridReact
        columnDefs={cols}
        rowData={rows}
        enableCellSpan
        getRowHeight={({ data }) => data.lines * LINE_HEIGHT}
      />
    </div>
  )
}

export default CallTable

const columnDefs = (inputs: readonly AbiParameter[], prefix: string = "") => {
  return inputs.map((input, index): ColDef<any, any> | ColGroupDef<any> => {
    const isTuple = "components" in input
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
      const stringify = input.type === "bool"

      return {
        headerName: name,
        field: prefix + name,
        spanRows: true,
        cellDataType: stringify ? "string" : undefined,
      }
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
      /** We're rendering array elements as sub rows (=lines) inside the row. This property indicates the number of such sub rows. */
      lines: maxArrayLength(Object.values(args), abi.inputs),
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

/** Returns the maximum _nested_ array length for the given inputs.  */
export const maxArrayLength = (
  values: any[],
  inputs: readonly AbiParameter[]
): number => {
  const maxLengths = inputs.map((input, index) => {
    const value = values[index]
    const elementType = arrayElementType(input)
    const isTuple = input.type === "tuple" && "components" in input

    if (isTuple) {
      invariant(
        typeof value === "object" && !Array.isArray(value) && value !== null,
        "Expected object for tuple"
      )
      return maxArrayLength(Object.values(value), input.components)
    }

    if (elementType) {
      invariant(Array.isArray(value), "Expected array for array")
      const itemLengths = value.map((itemValue) =>
        maxArrayLength([itemValue], [elementType])
      )
      return itemLengths.reduce((sum, length) => sum + length, 0)
    }

    return 1
  })

  return Math.max(...maxLengths)
}
