import { Call } from "@/app/api/records/types"
import { PrimitiveValue } from "../../abi"

export type StructRowValue = {
  [key: string]: RowValue
}

export type NestedArrayValues =
  | {
      span: number
      children: NestedArrayValues[]
    }
  | {
      span: number
      value: PrimitiveValue
    }

export type ArrayRowValue = {
  indices: NestedArrayValues
  values: StructRowValue | ArrayRowValue | NestedArrayValues
}

export type RowValue =
  | PrimitiveValue
  | StructRowValue
  | ArrayRowValue
  | NestedArrayValues

export interface Row {
  inputs: StructRowValue
  value: string
  operation: "call" | "delegatecall"
  metadata: Call["metadata"]

  /** We're rendering array elements as sub rows inside the row. The `span` property indicates the total number of such sub rows. */
  span: number

  deleted?: boolean
}

export type CallState = Call & {
  deleted?: boolean
}
