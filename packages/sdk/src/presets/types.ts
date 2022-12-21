import { BigNumberish } from "ethers"
import { BytesLike } from "ethers/lib/utils"

export interface ExecutionOptions {
  send?: boolean
  delegatecall?: boolean
}

type PrimitiveValue = BigNumberish | BytesLike | string | Boolean
export type Placeholder<_T> = symbol

type PrimitiveParamScoping<T> =
  | T
  | Placeholder<T>
  | { oneOf: (T | Placeholder<T>)[] }

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

type ArrayParamScoping<T extends unknown[]> =
  | (ArrayElement<T> | Placeholder<ArrayElement<T>>)[]
  | { oneOf: (ArrayElement<T> | Placeholder<ArrayElement<T>>)[][] }
  | {
      subsetOf: (ArrayElement<T> | Placeholder<ArrayElement<T>>)[]
      includeEmpty?: boolean
      restrictOrder?: boolean
    }

export type TupleScopings<Params extends [...any[]]> = {
  [Index in keyof Params]?: Params[Index] extends PrimitiveValue
    ? PrimitiveParamScoping<Params[Index]>
    : Params[Index] extends Array<any>
    ? ArrayParamScoping<Params[Index]>
    : StructScopings<Params[Index]>
} // TODO what about fixed-length arrays/tuple params? What scoping options shall be available for them?

export type StructScopings<Struct extends { [key: string]: any }> = {
  [Key in keyof Struct]?: Struct[Key] extends PrimitiveValue
    ? PrimitiveParamScoping<Struct[Key]>
    : Struct[Key] extends Array<any>
    ? ArrayParamScoping<Struct[Key]>
    : StructScopings<Struct[Key]>
}

export type ParamScoping<T> = T extends [...any[]]
  ? TupleScopings<any>
  : T extends { [key: string]: any }
  ? StructScopings<T>
  : T extends unknown[]
  ? ArrayParamScoping<T>
  : PrimitiveParamScoping<T>
