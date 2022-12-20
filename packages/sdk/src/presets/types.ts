import { BigNumberish } from "ethers"
import { BytesLike } from "ethers/lib/utils"

export interface ExecutionOptions {
  send?: boolean
  delegatecall?: boolean
}

export type ParamScoping<T> = T | { oneOf: T[] }

export type ArrayParamScoping<T> =
  | T
  | { oneOf: T[] }
  | { subsetOf: T; includeEmpty?: boolean; restrictOrder?: boolean }

export type TupleScopings<Params extends [...any[]]> = {
  [Index in keyof Params]?: Params[Index] extends
    | BigNumberish
    | BytesLike
    | string
    | boolean
    ? ParamScoping<Params[Index]>
    : Params[Index] extends Array<any>
    ? ArrayParamScoping<Params[Index]>
    : StructScopings<Params[Index]>
} // TODO what about fixed-length arrays/tuples?

export type StructScopings<Struct extends { [key: string]: any }> = {
  [Key in keyof Struct]?: Struct[Key] extends
    | BigNumberish
    | BytesLike
    | string
    | boolean
    ? ParamScoping<Struct[Key]>
    : Struct[Key] extends Array<any>
    ? ArrayParamScoping<Struct[Key]>
    : StructScopings<Struct[Key]>
}
