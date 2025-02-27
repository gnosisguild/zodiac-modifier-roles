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
import { NestedCellRenderer, NestedCellValue } from "./cellRenderers"
import classes from "./style.module.css"
import { theme } from "./theme"
// import { distributeArrayElements } from "./distributeArrayElements"
import { Row } from "./types"
import { makeFieldPathGetter } from "./fieldPathGetter"
import { totalNestedLength } from "./utils"

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  abi: AbiFunction
  calls: Call[]
}

const HEADER_HEIGHT = 48
const LINE_HEIGHT = 44

const CallTable: React.FC<Props> = ({ calls, abi }) => {
  const rows = rowData(calls, abi)

  const topLevelValueGetter = (row: Row | null | undefined) => {
    if (row == null) {
      throw new Error("do we have to implement this?")
    }

    return [{ value: row.inputs, span: row.span }]
  }
  const cols = columnDefs(abi.inputs, topLevelValueGetter)

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

type ValuesGetter = (
  row: Row | null | undefined
) => { value: any; span: number }[]

const columnDefs = (
  inputs: readonly AbiParameter[],
  parentValuesGetter: ValuesGetter
) => {
  return inputs.map((input, index): ColDef<Row, any> | ColGroupDef<Row> => {
    const elementType = arrayElementType(input)
    const isArray = elementType !== undefined
    const isTuple = "components" in input

    const baseDefs: ColDef<Row, any> = {
      headerName: input.name ?? "",
      spanRows: true, // TODO most probably this won't work with array values -> https://www.ag-grid.com/javascript-data-grid/row-spanning/#custom-row-spanning
      suppressMovable: true,
    }

    // derive nested values getters from the parent values getter
    const valuesGetter = (row: any) =>
      parentValuesGetter(row).map(({ value, span }) => ({
        value: value[input.name ?? index],
        span: totalNestedLength(value[input.name ?? index]),
      }))

    if (!isArray && isTuple) {
      /**
       * struct type: represent as column group
       */
      return {
        ...baseDefs,
        children: columnDefs(input.components, valuesGetter),
      }
    } else if (isArray) {
      /**
       * array type: represent as column group with index column
       */

      const indicesGetter = (row: any): NestedCellValue =>
        valuesGetter(row).map(({ value, span }) => {
          invariant(Array.isArray(value), "array expected")
          return {
            value: value.map((_, index) => index),
            span: value.map(totalNestedLength),
            totalSpan: span,
          }
        })

      const indexColumnDef: ColDef<Row, any> = {
        headerName: "#",
        spanRows: true, // TODO most probably this won't work with array values -> https://www.ag-grid.com/javascript-data-grid/row-spanning/#custom-row-spanning
        suppressMovable: true,
        cellRenderer: NestedCellRenderer,
        valueGetter: (params) => indicesGetter(params.data),
      }

      const elementsGetter = (row: any): NestedCellValue =>
        valuesGetter(row).map(({ value, span }) => {
          invariant(Array.isArray(value), "array expected")
          return value.map((element) => ({
            value: element,
            span: totalNestedLength(element),
          }))
        })

      const valueColumnDefs = isTuple
        ? columnDefs(input.components, elementsGetter)
        : columnDefs([elementType], elementsGetter)

      return {
        ...baseDefs,
        children: [indexColumnDef, ...valueColumnDefs],
      }
    } else {
      // const isBool = input.type === "bool"

      const valueGetter = (row: any): NestedCellValue =>
        valuesGetter(row).map(({ value, span }) => {
          invariant(
            typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean" ||
              typeof value === "bigint",
            "primitive value expected"
          )

          return {
            value: value,
            span: 1,
            totalSpan: span,
          }
        })

      const isNumeric =
        input.type.startsWith("uint") || input.type.startsWith("int")

      return {
        ...baseDefs,
        // cellDataType: isBool ? "string" : undefined,
        cellRenderer: NestedCellRenderer,
        valueGetter: (params) => valuesGetter(params.data),
        type: isNumeric ? "numericColumn" : undefined,
      }
    }
  })
}

const rowData = (calls: Call[], abi: AbiFunction): Row[] => {
  const decodedCalls = calls.map((call) => {
    const { args } = decodeFunctionData({ abi: [abi], data: call.data })
    const inputs = Object.fromEntries(
      abi.inputs.map((input, index) => [input.name, args[index]])
    )
    return {
      inputs,
      // inputs: distributeArrayElements(
      //   Object.fromEntries(
      //     abi.inputs.map((input, index) => [input.name, args[index]])
      //   )
      //   // abi.inputs
      // ),
      /** We're rendering array elements as sub rows inside the row. The `span` property indicates the total number of such sub rows. */
      // span: maxArrayLength(Object.values(args), abi.inputs),
      value: call.value,
      operation: call.operation,
      metadata: call.metadata,
      span: totalNestedLength(inputs),
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
