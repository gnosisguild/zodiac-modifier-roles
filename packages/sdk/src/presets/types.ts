import { BigNumberish } from "ethers"
import { BytesLike, ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../types"

export interface ExecutionOptions {
  send?: boolean
  delegatecall?: boolean
}

type PrimitiveValue = BigNumberish | BytesLike | string | boolean

export class Placeholder<T> {
  readonly name: string
  readonly type: string
  readonly description?: string

  private _identity?: Placeholder<T>

  constructor(name: string, type: ParamType | string, description?: string) {
    this.name = name
    this.type = typeof type === "string" ? type : type.format("sighash")
    this.description = description
  }

  as(newType: ParamType | string) {
    const result = new Placeholder<T>(this.name, newType, this.description)
    result._identity = this.identity
    return result
  }

  get identity(): Placeholder<T> {
    return this._identity || this
  }
}

export type PlaceholderValues<P extends RolePreset> = {
  [key in keyof P["placeholders"]]: P["placeholders"][key] extends Placeholder<
    infer T
  >
    ? T
    : never
}

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

export interface RolePreset {
  network: number
  allow: PresetAllowEntry[]
  placeholders: { [key: string]: Placeholder<any> }
}

// allows call to any function on the target addresses
export type PresetFullyClearedTarget = {
  targetAddress: string
} & ExecutionOptions

// allows calls to specific functions, optionally with parameter scoping
export type PresetFunction = ({ selector: string } | { signature: string }) & {
  targetAddress: string
  params?: (PresetScopeParam | undefined)[] | Record<number, PresetScopeParam>
} & ExecutionOptions

export type PresetAllowEntry = PresetFullyClearedTarget | PresetFunction

export type ComparisonValue = string | Placeholder<any>
export interface PresetScopeParam {
  type: ParameterType
  operator: Operator
  value: ComparisonValue | ComparisonValue[]
}
