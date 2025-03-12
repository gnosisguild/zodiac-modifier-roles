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
import { Call, Operation } from "@/app/api/records/types"
import { arrayElementType } from "@/utils/abi"
import {
  EditableCellRenderer,
  NestedIndicesRenderer,
  NestedValuesRenderer,
  RecordedCellRenderer,
} from "./cellRenderers"
import classes from "./style.module.css"
import { theme } from "./theme"
import { Row, StructRowValue } from "./types"
import { distributeArrayElements, totalSpan } from "./distributeArrayElements"
import { CustomHeader } from "./customHeader"

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  abi: AbiFunction
  calls: Call[]
}

const HEADER_HEIGHT = 32
const LINE_HEIGHT = 25

const CallTable: React.FC<Props> = ({ calls, abi }) => {
  const rows = rowData(calls, abi)

  const cols = [
    ...defaultColumnDefs(calls),
    ...inputColumnDefs(abi.inputs, { prefix: "inputs.", isLastGroup: true }),
    ...metadataColumns,
  ]
  const totalSpan = rows.reduce((sum, row) => sum + row.span, 0)

  return (
    <div
      className={classes.table}
      style={{
        height:
          totalSpan * LINE_HEIGHT + // amount of data
          (maxColNesting(cols) + 1) * HEADER_HEIGHT + // amount of stacked header rows + 1 for the scoping row
          3, // account for borders
      }}
    >
      <AgGridReact
        headerHeight={HEADER_HEIGHT * 2}
        groupHeaderHeight={HEADER_HEIGHT}
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

const inputColumnDefs = (
  inputs: readonly AbiParameter[],
  {
    prefix,
    arrayDescendant,
    carryComponentNameToValuesColumn,
    isLastGroup,
  }: {
    prefix: string
    arrayDescendant?: boolean
    carryComponentNameToValuesColumn?: string
    isLastGroup?: boolean
  }
) => {
  return inputs.flatMap(
    (
      input,
      index
    ):
      | ColDef<Row, any>
      | ColGroupDef<Row>
      | (ColDef<Row, any> | ColDef<Row, any>)[] => {
      const elementType = arrayElementType(input)
      const isArray = elementType !== undefined
      const isTuple = "components" in input && Array.isArray(input.components)
      const isLastChild = index === inputs.length - 1

      const baseDefs: ColDef<Row, any> = {
        headerName: carryComponentNameToValuesColumn ?? input.name ?? "",
        minWidth: 110,
        cellDataType: "text",
        // spanRows: true,
        suppressMovable: true,
        headerClass: cn(
          // !!carryComponentNameToValuesColumn && "agx-header-array-values",
          isLastChild && "agx-header-cell-last-child"
        ),

        headerComponent: CustomHeader,
        headerComponentParams: {
          isWildcarded: false, // TODO
          noScoping: arrayDescendant,
        },
      }

      const componentName = input.name ?? `[${index}]`
      const field = (prefix +
        (carryComponentNameToValuesColumn
          ? "values"
          : componentName)) as NestedFieldPaths<Row>

      if (!isArray && isTuple) {
        /**
         * struct type: represent as column group
         */
        return {
          ...baseDefs,
          field,
          children: inputColumnDefs(input.components, {
            prefix: field + ".",
            arrayDescendant,
            isLastGroup: isLastGroup && isLastChild,
          }),
        } as ColGroupDef<Row>
      } else if (isArray) {
        /**
         * array type: represent as two columns (indices and values) without group nesting
         */

        const indexColumnDef: ColDef<Row, any> = {
          field: (field + ".indices") as NestedFieldPaths<Row>,
          cellDataType: "text",
          headerName: "#",
          headerClass: "agx-header-array-indices",
          width: 30,
          resizable: false,
          sortable: false,
          suppressMovable: true,
          cellRenderer: NestedIndicesRenderer,

          headerComponent: CustomHeader,
        }

        const elementColumnDefs = inputColumnDefs([elementType], {
          prefix: field + ".",
          carryComponentNameToValuesColumn: componentName,
          arrayDescendant: true,
          isLastGroup: isLastGroup && isLastChild,
        })

        // For arrays of non-tuples we also skip nesting and name the values column after the current field
        return [
          indexColumnDef,

          // Usually the elementColumnDefs will be a single column, but for multi-dimensional arrays elementColumnDefs.length will be greater than 1.
          // Thus, we flatten multi-dimensional arrays by prepending an indices column for each level.
          // TODO multi-dimensional arrays have not been tested yet and might not be handled correctly
          ...elementColumnDefs,
        ]
      } else {
        const isBool = input.type === "bool"
        // const isNumeric =
        //   input.type.startsWith("uint") || input.type.startsWith("int")

        return {
          ...baseDefs,
          field,
          headerClass: baseDefs.headerClass,
          cellClass: cn(isLastGroup && isLastChild && "agx-inputs-column-last"),
          sortable: !arrayDescendant,
          cellRenderer: arrayDescendant ? NestedValuesRenderer : undefined,
        }
      }
    }
  )
}

const defaultColumnDefs = (calls: Call[]): ColDef<Row>[] => {
  const includesDelegateCalls = calls.some(
    (call) => call.operation === Operation.DelegateCall
  )
  const includesValue = calls.some((call) => BigInt(call.value || 0) > 0n)

  const delegateCallColumn: ColDef<Row> = {
    headerName: "operation",
    field: "operation",
    width: 110,
    resizable: false,
    suppressMovable: true,
    cellClass: cn(
      "agx-default-column",
      !includesValue && "agx-default-column-last"
    ),
  }

  const valueColumn: ColDef<Row> = {
    headerName: "value",
    minWidth: 110,
    field: "value",
    // type: "numericColumn",
    suppressMovable: true,
    cellClass: "agx-default-column agx-default-column-last",
    headerComponent: CustomHeader,
    headerComponentParams: {
      isWildcarded: true,
      disableScoping: true,
    },
  }

  const result = []
  if (includesDelegateCalls) result.push(delegateCallColumn)
  if (includesValue) result.push(valueColumn)

  return result
}

const metadataColumns: ColDef<Row>[] = [
  {
    headerName: "label",
    cellDataType: "text",
    field: "metadata.label",
    cellClass: "agx-label-column",
    cellRenderer: EditableCellRenderer,
    editable: true,
    headerComponent: CustomHeader,
    headerComponentParams: {
      noScoping: true,
    },
  },
  {
    headerName: "recorded",
    cellDataType: "text",
    field: "metadata",
    cellClass: "agx-recorded-column",
    cellRenderer: RecordedCellRenderer,
    width: 120,
    headerComponent: CustomHeader,
    headerComponentParams: {
      noScoping: true,
    },
  },
]

const rowData = (calls: Call[], abi: AbiFunction): Row[] => {
  const decodedCalls = calls.map((call) => {
    const { args } = decodeFunctionData({ abi: [abi], data: call.data })

    const inputs = distributeArrayElements(
      Object.fromEntries(
        abi.inputs.map((input, index) => [input.name, args[index]])
      )
    ) as StructRowValue

    return {
      value: call.value,
      operation:
        call.operation === Operation.DelegateCall
          ? ("delegatecall" as const)
          : ("call" as const),
      inputs,
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
