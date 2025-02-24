import { Call, Operation } from "@/app/api/records/types"

type PrimitiveValue = string | boolean | number | bigint

export type AbiInput = StructAbiInput | AbiInput[] | PrimitiveValue

type StructAbiInput = {
  [key: string]: AbiInput
}

export type StructRowValue = {
  [key: string]: RowValue
}

type ArrayLeave = { elements: PrimitiveValue[]; span: number[] }

export type ArrayRowValue = {
  indices: ArrayLeave
  values: StructRowValue | ArrayRowValue | ArrayLeave
}

export type RowValue =
  | PrimitiveValue
  | StructRowValue
  | ArrayRowValue
  | ArrayLeave

export interface Row {
  inputs: StructRowValue
  /** We're rendering array elements as sub rows inside the row. The `span` property indicates the total number of such sub rows. */
  span: number
  value: string
  operation: Operation
  metadata: Call["metadata"]
}
