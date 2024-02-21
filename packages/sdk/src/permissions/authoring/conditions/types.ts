import { BigNumberish, BytesLike } from "ethers"
import { ParamType } from "ethers/lib/utils"

import { Condition } from "../../../types"

export type ConditionFunction<T> = (
  abiType: ParamType,
  _?: T // we must use the generic to make TS check on it (see: https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-type-inference-work-on-this-interface-interface-foot--)
) => Condition

type PrimitiveValue = BigNumberish | BytesLike | string | boolean

type PrimitiveScoping<T extends PrimitiveValue> = T | ConditionFunction<T>

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type ArrayScoping<T extends any[]> =
  | readonly Awaited<ArrayElement<T>>[]
  | ConditionFunction<Awaited<ArrayElement<T>>[]>

type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

export type StructScoping<Struct extends { [key: string]: any }> =
  | RequireAtLeastOne<{
      [Key in keyof Struct]?: Awaited<Struct[Key]> extends PrimitiveValue
        ? PrimitiveScoping<Awaited<Struct[Key]>>
        : Awaited<Struct[Key]> extends unknown[]
        ? ArrayScoping<Awaited<Struct[Key]>>
        : StructScoping<Awaited<Struct[Key]>>
    }>
  | ConditionFunction<Struct>

/**
 * A scoping is one of the following:
 * - a primitive, BigNumber, or array value – will be used for an equality check
 * - an object – will be used as a matching pattern
 * - a condition function
 */
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
