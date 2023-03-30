import { BigNumber, BigNumberish, BytesLike } from "ethers"
import { ParamType } from "ethers/lib/utils"
import { RequireAtLeastOne } from "type-fest"

import { Placeholder, PresetCondition } from "../../types"

export type ConditionFunction<T> = (
  abiType: ParamType,
  _?: T // we must use the generic to make TS check on it (see: https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-type-inference-work-on-this-interface-interface-foot--)
) => PresetCondition

export type NestedRecordOrArray<T> =
  | { [name: string]: T | NestedRecordOrArray<T> }
  | (T | NestedRecordOrArray<T>)[]

type PrimitiveValue = BigNumberish | BytesLike | string | boolean

type PrimitiveScoping<T extends PrimitiveValue> =
  | T
  | Placeholder<T>
  | ConditionFunction<T>

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type ArrayScoping<T extends any[]> =
  | (Awaited<ArrayElement<T>> | Placeholder<Awaited<ArrayElement<T>>>)[]
  | ConditionFunction<Awaited<ArrayElement<T>>[]>

export type StructScoping<Struct extends { [key: string]: any }> =
  | RequireAtLeastOne<{
      [Key in keyof Struct]?: Awaited<Struct[Key]> extends PrimitiveValue
        ? PrimitiveScoping<Awaited<Struct[Key]>>
        : Awaited<Struct[Key]> extends unknown[]
        ? ArrayScoping<Awaited<Struct[Key]>>
        : StructScoping<Awaited<Struct[Key]>>
    }>
  | ConditionFunction<Struct>

export type Scoping<T> = T extends PrimitiveValue
  ? PrimitiveScoping<T>
  : T extends any[]
  ? ArrayScoping<T>
  : T extends { [key: string]: any }
  ? StructScoping<T>
  : unknown // it resolves to this if T is any (for example when using scoping functions outside of the typed context)

export type TupleScopings<Params extends [...any[]]> = {
  [Index in keyof Params]?: Awaited<Params[Index]> extends PrimitiveValue
    ? PrimitiveScoping<Awaited<Params[Index]>>
    : Awaited<Params[Index]> extends any[]
    ? ArrayScoping<Awaited<Params[Index]>>
    : StructScoping<Awaited<Params[Index]>>
}
