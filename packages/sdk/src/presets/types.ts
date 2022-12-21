import { BigNumberish } from "ethers"
import { BytesLike } from "ethers/lib/utils"

export interface ExecutionOptions {
  send?: boolean
  delegatecall?: boolean
}

type PrimitiveValue = BigNumberish | BytesLike | string | boolean
export type Placeholder<T extends PrimitiveValue> = BigNumberish extends T
  ? { bignumberish: symbol }
  : BytesLike extends T
  ? { byteslike: symbol }
  : string extends T
  ? { string: symbol }
  : boolean extends T
  ? { boolean: symbol }
  : never

type PrimitiveParamScoping<T extends PrimitiveValue> =
  | T
  | Placeholder<T>
  | { oneOf: (T | Placeholder<T>)[] }

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
  [Index in keyof Params]?: Params[Index] extends PrimitiveValue
    ? PrimitiveParamScoping<Params[Index]>
    : Params[Index] extends PrimitiveValue[]
    ? ArrayParamScoping<Params[Index]>
    : StructScopings<Params[Index]>
} // TODO what about fixed-length arrays/tuple params? What scoping options shall be available for them?

export type StructScopings<Struct extends { [key: string]: any }> = {
  [Key in keyof Struct]?: Struct[Key] extends PrimitiveValue
    ? PrimitiveParamScoping<Struct[Key]>
    : Struct[Key] extends PrimitiveValue[]
    ? ArrayParamScoping<Struct[Key]>
    : StructScopings<Struct[Key]>
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
