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
import { arrayElementType } from "@/utils/abi"
import { ArrayIndicesRenderer, ArrayRenderer } from "./cellRenderers"
import classes from "./style.module.css"
import { theme } from "./theme"
import { distributeArrayElements } from "./distributeArrayElements"
import { Row } from "./types"
import { makeFieldPathGetter } from "./fieldPathGetter"

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
  const totalSpan = rows.reduce((sum, row) => sum + row.span, 0)
  console.log({
    cols,
    rows,
    totalSpan,
    maxNesting: maxNesting(cols),
  })

  return (
    <div
      className={classes.table}
      style={{
        height: totalSpan * LINE_HEIGHT + maxNesting(cols) * HEADER_HEIGHT,
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

const columnDefs = (inputs: readonly AbiParameter[], prefix: string = "") => {
  return inputs.map((input, index): ColDef<Row, any> | ColGroupDef<Row> => {
    const elementType = arrayElementType(input)
    const isTuple = "components" in input
    const name = input.name ?? `[${index}]`

    const baseDefs: ColDef<Row, any> = {
      headerName: name,
      field: (prefix + name) as any,
      spanRows: true,
      suppressMovable: true,
    }

    if (!elementType && isTuple) {
      // struct type: represent as column group
      return {
        ...baseDefs,
        children: columnDefs(input.components, prefix + name + "."),
      }
    } else if (elementType) {
      // array type: represent as column group with index column

      const valueColumnDefs = isTuple
        ? columnDefs(input.components, prefix + name + ".values.")
        : columnDefs([elementType], prefix + name + ".values")

      const indexColumnDef: ColDef<Row, any> = {
        headerName: "#",
        field: (prefix + name + "." + "index") as any,
        spanRows: true,
        suppressMovable: true,
        cellRenderer: ArrayIndicesRenderer,
        valueGetter: (params) => ({
          elements: makeFieldPathGetter(prefix + name + "." + "indices")(
            params.data
          ),
          span: makeFieldPathGetter(prefix + name + "." + "span")(params.data),
        }),
      }

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
        cellDataType: isBool ? "string" : undefined,
        // cellRenderer: isArray ? ArrayRenderer : undefined,
        type: isNumeric ? "numericColumn" : undefined,
      }
    }
  })
}

const rowData = (calls: Call[], abi: AbiFunction): Row[] => {
  const decodedCalls = calls.map((call) => {
    const { args } = decodeFunctionData({ abi: [abi], data: call.data })

    return {
      inputs: distributeArrayElements(
        Object.fromEntries(
          abi.inputs.map((input, index) => [input.name, args[index]])
        ),
        abi.inputs
      ),
      /** We're rendering array elements as sub rows inside the row. The `span` property indicates the total number of such sub rows. */
      span: maxArrayLength(Object.values(args), abi.inputs),
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
