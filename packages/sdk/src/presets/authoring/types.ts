import { BigNumberish, BytesLike } from "ethers"
import { ParamType } from "ethers/lib/utils"

import { Placeholder, PresetCondition } from "../types"

export type ConditionFunction<_T> = (abiType: ParamType) => PresetCondition

export type NestedRecordOrArray<T> =
  | { [name: string]: T | NestedRecordOrArray<T> }
  | (T | NestedRecordOrArray<T>)[]

type PrimitiveValue = BigNumberish | BytesLike | string | boolean

type PromiseOrValue<T> = T | Promise<T>
type UnwrapPromise<T> = T extends PromiseOrValue<infer U>[]
  ? U[]
  : T extends PromiseOrValue<infer V>
  ? V
  : T

type PrimitiveParamScoping<T extends PrimitiveValue> =
  | T
  | Placeholder<T>
  | ConditionFunction<T>

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

type ArrayParamScoping<T extends PrimitiveValue[]> =
  | (ArrayElement<T> | Placeholder<ArrayElement<T>>)[]
  | ConditionFunction<T>

export type TupleScoping<Params extends [...any[]]> = {
  [Index in keyof Params]?: UnwrapPromise<Params[Index]> extends PrimitiveValue
    ? PrimitiveParamScoping<UnwrapPromise<Params[Index]>>
    : UnwrapPromise<Params[Index]> extends PrimitiveValue[]
    ? ArrayParamScoping<UnwrapPromise<Params[Index]>>
    : StructScoping<UnwrapPromise<Params[Index]>>
}

export type StructScoping<Struct extends { [key: string]: any }> = {
  [Key in keyof Struct]?: UnwrapPromise<Struct[Key]> extends PrimitiveValue
    ? PrimitiveParamScoping<UnwrapPromise<Struct[Key]>>
    : UnwrapPromise<Struct[Key]> extends PrimitiveValue[]
    ? ArrayParamScoping<UnwrapPromise<Struct[Key]>>
    : StructScoping<UnwrapPromise<Struct[Key]>>
}

export type Scoping<T> = T extends [...any[]]
  ? TupleScoping<T>
  : T extends { [key: string]: any }
  ? StructScoping<T>
  : T extends PrimitiveValue[]
  ? ArrayParamScoping<T>
  : T extends PrimitiveValue
  ? PrimitiveParamScoping<T>
  : never
