import { Addressable, BigNumberish, BytesLike, ParamType, Typed } from "ethers"
import { Condition } from "zodiac-roles-deployments"

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

// Exclude alternative union members that ethers supports for specifying parameters:
// Typed, Promise<any>, Addressable
export type PrimitiveOnly<T> = Exclude<T, Typed | Promise<any> | Addressable>
type MapToScoping<T> =
  PrimitiveOnly<T> extends PrimitiveValue
    ? PrimitiveScoping<PrimitiveOnly<T>>
    : PrimitiveOnly<T> extends unknown[]
      ? ArrayScoping<PrimitiveOnly<T>>
      : PrimitiveOnly<T> extends { [key: string]: any }
        ? StructScoping<PrimitiveOnly<T>>
        : never

export type StructScoping<Struct extends { [key: string]: any }> =
  | RequireAtLeastOne<{
      [Key in keyof Struct]?: MapToScoping<Struct[Key]>
    }>
  | ConditionFunction<Struct>

/**
 * A scoping is one of the following:
 * - a primitive or array value – will be used for an equality check
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
  [Index in keyof Params]?: MapToScoping<Params[Index]>
}
