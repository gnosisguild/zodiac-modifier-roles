import { BigNumber, BigNumberish, BytesLike } from "ethers"
import { ParamType } from "ethers/lib/utils"
import { RequireAtLeastOne } from "type-fest"

import { Placeholder, PresetCondition } from "../types"

export type ConditionFunction<T> = (
  abiType: ParamType,
  _?: T // we must use the generic to make TS check on it
) => PresetCondition

export type NestedRecordOrArray<T> =
  | { [name: string]: T | NestedRecordOrArray<T> }
  | (T | NestedRecordOrArray<T>)[]

type PrimitiveValue = BigNumberish | BytesLike | string | boolean

type PromiseOrValue<T> = T | Promise<T>
export type UnwrapPromise<T> = T extends PromiseOrValue<infer U>[]
  ? U[]
  : T extends PromiseOrValue<infer V>
  ? V
  : T

type PrimitiveParamScoping<T extends PrimitiveValue> =
  | T
  | Placeholder<T>
  | ConditionFunction<T>

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

type ArrayParamScoping<T extends any[]> =
  | (ArrayElement<T> | Placeholder<ArrayElement<T>>)[]
  | ConditionFunction<T>

export type TupleScoping<Params extends [...any[]]> = {
  [Index in keyof Params]?: UnwrapPromise<Params[Index]> extends PrimitiveValue
    ? PrimitiveParamScoping<UnwrapPromise<Params[Index]>>
    : UnwrapPromise<Params[Index]> extends any[]
    ? ArrayParamScoping<UnwrapPromise<Params[Index]>>
    : StructScoping<UnwrapPromise<Params[Index]>>
}

export type StructScoping<Struct extends { [key: string]: any }> =
  | RequireAtLeastOne<{
      [Key in keyof Struct]?: UnwrapPromise<Struct[Key]> extends PrimitiveValue
        ? PrimitiveParamScoping<UnwrapPromise<Struct[Key]>>
        : UnwrapPromise<Struct[Key]> extends unknown[]
        ? ArrayParamScoping<UnwrapPromise<Struct[Key]>>
        : StructScoping<UnwrapPromise<Struct[Key]>>
    }>
  | ConditionFunction<Struct>

export type Scoping<T> = T extends [...unknown[]]
  ? TupleScoping<T>
  : T extends { [key: string]: any }
  ? StructScoping<T>
  : T extends PrimitiveValue[]
  ? ArrayParamScoping<T>
  : T extends PrimitiveValue
  ? PrimitiveParamScoping<T>
  : never

type ScopingBN = Scoping<BigNumberish>

type Test<T> = T extends { [key: string]: any } ? boolean : string
type R = Test<BigNumberish> // TODO interesting how in TS ternaries both branches can be taken at once
