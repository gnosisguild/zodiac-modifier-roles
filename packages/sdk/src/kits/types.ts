import { BigNumberish, BytesLike } from "ethers"

import { Placeholder } from "../presets/types"

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
  | { oneOf: (T | Placeholder<T>)[] }

type BigNumberishParamScoping<T extends BigNumberish> =
  | T
  | Placeholder<T>
  | { oneOf: (T | Placeholder<T>)[] }
  | { greaterThan: T | Placeholder<T> }
  | { lessThan: T | Placeholder<T> }

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

type ArrayParamScoping<T extends PrimitiveValue[]> =
  | (ArrayElement<T> | Placeholder<ArrayElement<T>>)[]
  | { oneOf: (ArrayElement<T> | Placeholder<ArrayElement<T>>)[][] }
  | {
      subsetOf: (ArrayElement<T> | Placeholder<ArrayElement<T>>)[]
      includeEmpty?: boolean
      restrictOrder?: boolean
    }

export type TupleScopings<Params extends [...any[]]> = {
  [Index in keyof Params]?: UnwrapPromise<Params[Index]> extends PrimitiveValue
    ? PrimitiveParamScoping<UnwrapPromise<Params[Index]>>
    : UnwrapPromise<Params[Index]> extends PrimitiveValue[]
    ? ArrayParamScoping<UnwrapPromise<Params[Index]>>
    : StructScopings<UnwrapPromise<Params[Index]>>
} // TODO what about fixed-length arrays/tuple params? What scoping options shall be available for them?

export type StructScopings<Struct extends { [key: string]: any }> = {
  [Key in keyof Struct]?: UnwrapPromise<Struct[Key]> extends PrimitiveValue
    ? PrimitiveParamScoping<UnwrapPromise<Struct[Key]>>
    : UnwrapPromise<Struct[Key]> extends PrimitiveValue[]
    ? ArrayParamScoping<UnwrapPromise<Struct[Key]>>
    : StructScopings<UnwrapPromise<Struct[Key]>>
}

export type ParamScoping<T> = T extends [...any[]]
  ? TupleScopings<any>
  : T extends { [key: string]: any }
  ? StructScopings<T>
  : T extends PrimitiveValue[]
  ? ArrayParamScoping<T>
  : T extends PrimitiveValue
  ? PrimitiveParamScoping<T>
  : never
