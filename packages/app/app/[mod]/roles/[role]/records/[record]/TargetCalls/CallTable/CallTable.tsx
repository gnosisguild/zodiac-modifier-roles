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
  ActionsCellRenderer,
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

/**
 * @param columnPath - A dot-separated path to the ABI parameter that was toggled.
 * @param isWildcarded - Whether the parameter is wildcarded or scoped to the recorded values (`true` means that any parameter value is allowed)
 */
type WildcardToggleHandler = (paramPath: string, isWildcarded: boolean) => void

export interface CallActionHandlers {
  onWildcardToggle: WildcardToggleHandler
  onLabelEdit: (callId: string, newLabel: string) => void
  onDelete: (callId: string) => void
}

type Props = {
  abi: AbiFunction
  calls: Call[]
  wildcards: { [paramPath: string]: boolean }
} & CallActionHandlers

const HEADER_HEIGHT = 32
const LINE_HEIGHT = 25

const CallTable: React.FC<Props> = ({
  calls,
  wildcards,
  abi,
  onLabelEdit,
  onWildcardToggle,
  onDelete,
}) => {
  const rows = rowData(calls, abi)

  const cols = [
    ...defaultColumnDefs(calls),
    ...inputColumnDefs(abi.inputs, wildcards, {
      prefix: "inputs.",
      isLastGroup: true,
    }),
    ...metadataColumns,
  ]
  const totalSpan = rows.reduce((sum, row) => sum + row.span, 0)

  const handleWildcardToggle: WildcardToggleHandler = (
    paramPath,
    isWildcarded
  ) => {
    onWildcardToggle(cleanPath(abi.inputs, paramPath), isWildcarded)
  }

  const handleDelete = (callIndex: number) => {
    onDelete(calls[callIndex].id)
  }

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
        readOnlyEdit // don't let ag-grid handle cell edits in its own internal state
        onCellEditRequest={(event) => {
          if (event.rowIndex === null) {
            throw new Error("Expected to receive row index")
          }
          onLabelEdit(calls[event.rowIndex].id, event.newValue)
        }}
        context={{
          onDelete: handleDelete,
          onWildcardToggle: handleWildcardToggle,
        }}
      />
    </div>
  )
}

export default CallTable

const inputColumnDefs = (
  inputs: readonly AbiParameter[],
  wildcards: { [paramPath: string]: boolean },
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

      const componentName = input.name ?? `[${index}]`
      const field = (prefix +
        (carryComponentNameToValuesColumn
          ? "values"
          : componentName)) as NestedFieldPaths<Row>

      const baseDefs: ColDef<Row, any> = {
        field,
        headerName: carryComponentNameToValuesColumn ?? input.name ?? "",
        minWidth: 110,
        cellDataType: "text",
        // spanRows: true,
        suppressMovable: true,
        headerClass: cn(
          // !!carryComponentNameToValuesColumn && "agx-header-array-values",
          isLastChild && "agx-header-cell-last-child"
        ),
      }

      if (!isArray && isTuple) {
        /**
         * struct type: represent as column group
         */
        return {
          ...baseDefs,
          children: inputColumnDefs(input.components, wildcards, {
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

        const elementColumnDefs = inputColumnDefs([elementType], wildcards, {
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
        return {
          ...baseDefs,
          headerComponent: CustomHeader,
          headerComponentParams: {
            isWildcarded: wildcards[cleanPath(inputs, field)] === true,
            noScoping: arrayDescendant,
          },
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
      scopingLabel: "allow send",
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
    suppressMovable: true,
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
    resizable: false,
    suppressMovable: true,
    headerComponent: CustomHeader,
    headerComponentParams: {
      noScoping: true,
    },
  },
  {
    headerName: "",
    cellDataType: "text",
    field: "metadata",
    width: 120,
    suppressMovable: true,
    resizable: false,
    cellClass: "agx-actions-column",
    cellRenderer: ActionsCellRenderer,
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

/** turns the column path into a ABI parameter path, ironing out some small discrepancies that stem from array handling */
function cleanPath(params: readonly AbiParameter[], path: string): string {
  invariant(path.startsWith("inputs."), "unexpected path")
  const parts = path.split(".")

  // skip over the first part (inputs.)
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]

    const current = params.find((p) => p.name === part)
    if (!current) {
      throw new Error(`Invalid path: ${path}. Parameter ${part} not found`)
    }
    // If we hit an array, validate remaining path is ".indices"
    if (arrayElementType(current) !== undefined) {
      const remainingPath = parts.slice(i).join(".")
      if (remainingPath !== "indices") {
        throw new Error(
          `Invalid path: ${path}. Array can only be followed by ".indices"`
        )
      }
      return parts.slice(1, i).join(".")
    }

    if ("components" in current && Array.isArray(current.components)) {
      params = current.components
    } else {
      invariant(i === parts.length - 1, "unexpected path")
    }
  }

  return parts.slice(1).join(".")
}
