"use client"
import { AgGridReact } from "ag-grid-react"
import {
  ModuleRegistry,
  AllCommunityModule,
  ColDef,
  ColGroupDef,
  NestedFieldPaths,
} from "ag-grid-community"
import { invariant } from "@epic-web/invariant"
import { AbiFunction, AbiParameter, decodeFunctionData } from "viem"
import { Call } from "@/app/api/records/types"
import { arrayElementType } from "@/utils/abi"
import { NestedCellRenderer, NestedCellValue } from "./cellRenderers"
import classes from "./style.module.css"
import { theme } from "./theme"
// import { distributeArrayElements } from "./distributeArrayElements"
import { Row, StructRowValue } from "./types"
import { distributeArrayElements, totalSpan } from "./distributeArrayElements"

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  abi: AbiFunction
  calls: Call[]
}

const HEADER_HEIGHT = 48
const LINE_HEIGHT = 44

const CallTable: React.FC<Props> = ({ calls, abi }) => {
  const rows = rowData(calls, abi)
  const cols = columnDefs(abi.inputs)

  const totalSpan = rows.reduce((sum, row) => sum + row.span, 0)
  console.log({
    cols,
    rows,
    totalSpan,
    maxNesting: maxColNesting(cols),
  })

  return (
    <div
      className={classes.table}
      style={{
        height: totalSpan * LINE_HEIGHT + maxColNesting(cols) * HEADER_HEIGHT,
      }}
    >
      <AgGridReact
        columnDefs={cols}
        rowData={rows}
        enableCellSpan
        getRowHeight={({ data }) => {
          invariant(data, "row groups not supported")
          return data.span * LINE_HEIGHT
        }}
        theme={theme}
      />
    </div>
  )
}

export default CallTable

const columnDefs = (
  inputs: readonly AbiParameter[],
  prefix = "",
  inArray = false
) => {
  return inputs.map((input, index): ColDef<Row, any> | ColGroupDef<Row> => {
    const elementType = arrayElementType(input)
    const isArray = elementType !== undefined
    const isTuple = "components" in input

    const baseDefs: ColDef<Row, any> = {
      headerName: input.name ?? "",
      spanRows: true,
      suppressMovable: true,
    }

    const field = (prefix +
      (input.name ?? `[${index}]`)) as NestedFieldPaths<Row>

    if (!isArray && isTuple) {
      /**
       * struct type: represent as column group
       */
      return {
        ...baseDefs,
        field,
        children: columnDefs(input.components, field + ".", inArray),
      }
    } else if (isArray) {
      /**
       * array type: represent as column group with index column
       */

      const indexColumnDef: ColDef<Row, any> = {
        field,
        headerName: "#",
        spanRows: true,
        suppressMovable: true,
        cellRenderer: NestedIndicesRenderer,
      }

      const valueColumnDefs = isTuple
        ? columnDefs(input.components, field + ".values", true)
        : columnDefs([elementType], field + ".values", true)

      return {
        ...baseDefs,
        children: [indexColumnDef, ...valueColumnDefs],
      }
    } else {
      const isBool = input.type === "bool"
      const isNumeric =
        input.type.startsWith("uint") || input.type.startsWith("int")

      return {
        ...baseDefs,
        field,
        cellDataType: isBool ? "string" : undefined,
        type: isNumeric ? "numericColumn" : undefined,
        cellRenderer: inArray ? NestedValuesRenderer : undefined,
      }
    }
  })
}

const rowData = (calls: Call[], abi: AbiFunction): Row[] => {
  const decodedCalls = calls.map((call) => {
    const { args } = decodeFunctionData({ abi: [abi], data: call.data })
    const inputs = distributeArrayElements(
      Object.fromEntries(
        abi.inputs.map((input, index) => [input.name, args[index]])
      )
    ) as StructRowValue

    return {
      inputs,
      value: call.value,
      operation: call.operation,
      metadata: call.metadata,
      span: totalSpan(inputs),
    }
  })

  return decodedCalls
}

const maxColNesting = (
  colDefs: (ColDef<any, any> | ColGroupDef<any>)[]
): number => {
  return colDefs.reduce((max, colDef) => {
    if ("children" in colDef) {
      return Math.max(max, maxColNesting(colDef.children) + 1)
    }
    return max
  }, 1)
}
