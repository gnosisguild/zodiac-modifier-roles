"use client"
import { AgGridReact } from "ag-grid-react"
import {
  ModuleRegistry,
  AllCommunityModule,
  ColDef,
  ColGroupDef,
  NestedFieldPaths,
} from "ag-grid-community"
import cn from "classnames"
import { invariant } from "@epic-web/invariant"
import { AbiFunction, AbiParameter, decodeFunctionData } from "viem"
import { Call } from "@/app/api/records/types"
import { arrayElementType } from "@/utils/abi"
import { NestedIndicesRenderer, NestedValuesRenderer } from "./cellRenderers"
import classes from "./style.module.css"
import { theme } from "./theme"
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
  const cols = columnDefs(abi.inputs, { prefix: "inputs." })

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
  {
    prefix,
    isArrayValues,
    arrayDescendant,
  }: { prefix: string; isArrayValues?: boolean; arrayDescendant?: boolean }
) => {
  return inputs.map((input, index): ColDef<Row, any> | ColGroupDef<Row> => {
    const elementType = arrayElementType(input)
    const isArray = elementType !== undefined
    const isTuple = "components" in input && Array.isArray(input.components)
    const isLastChild = index === inputs.length - 1

    const baseDefs: ColDef<Row, any> = {
      headerName: isArrayValues ? "elements" : input.name ?? "",
      // spanRows: true,
      suppressMovable: true,
      headerClass: cn(
        isArrayValues && classes.headerArrayValues,
        isLastChild && "agx-header-cell-last-child"
      ),
    }

    const componentName = input.name ?? `[${index}]`
    const field = (prefix +
      (isArrayValues ? "values" : componentName)) as NestedFieldPaths<Row>

    if (!isArray && isTuple) {
      /**
       * struct type: represent as column group
       */
      return {
        ...baseDefs,
        field,
        children: columnDefs(input.components, {
          prefix: field + ".",
          arrayDescendant,
        }),
      }
    } else if (isArray) {
      /**
       * array type: represent as column group with index column
       */

      const indexColumnDef: ColDef<Row, any> = {
        field: (field + ".indices") as NestedFieldPaths<Row>,
        headerName: "#",
        headerClass: cn(classes.headerArrayIndices, "ag-right-aligned-header"),
        width: 30,
        type: "numericColumn",
        // spanRows: true,
        suppressMovable: true,
        cellRenderer: NestedIndicesRenderer,
      }

      // For arrays of tuples we skip one level of nesting and render the unfolded tuple properties directly next to the index column.
      // For arrays of non-tuples we create a value column artificial column group with the element type.
      const valueColumnDefs = isTuple
        ? columnDefs(input.components, {
            prefix: field + ".values.",
            arrayDescendant: true,
          })
        : columnDefs([elementType], {
            prefix: field + ".",
            isArrayValues: true,
            arrayDescendant: true,
          })

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
        headerClass: cn(
          baseDefs.headerClass,
          isNumeric && "ag-right-aligned-header"
        ),
        cellRenderer: arrayDescendant ? NestedValuesRenderer : undefined,
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
