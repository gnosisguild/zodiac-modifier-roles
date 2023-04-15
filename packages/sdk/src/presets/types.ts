import { ParamType } from "ethers/lib/utils"

import { Operator, ParameterType } from "../types"

export type AbiType = string | ParamType

export interface ExecutionFlags {
  send?: boolean
  delegatecall?: boolean
}

export class Placeholder<T> {
  readonly name: string
  readonly type: ParamType
  readonly description?: string

  private _identity?: Placeholder<T>

  constructor(name: string, type: AbiType, description?: string) {
    this.name = name
    this.type = ParamType.from(type)
    this.description = description
  }

  as(newType: AbiType) {
    if (
      ParamType.from(newType).format("sighash") === this.type.format("sighash")
    ) {
      return this
    }

    const result = new Placeholder<T>(this.name, newType, this.description)
    result._identity = this.identity
    return result
  }

  get identity(): Placeholder<T> {
    return this._identity || this
  }
}

export type PlaceholderValues<P extends PermissionPreset> = {
  [key in keyof P["placeholders"]]: P["placeholders"][key] extends Placeholder<
    infer T
  >
    ? T
    : never
}

export interface PermissionPreset {
  network: number
  allow: PresetAllowEntry[]
  placeholders: { [key: string]: Placeholder<any> }
}

// allows call to any function on the target addresses
export type PresetFullyClearedTarget = {
  targetAddress: string
} & ExecutionFlags

// allows calls to specific functions, optionally with parameter scoping
export type PresetFunction = ({ selector: string } | { signature: string }) & {
  targetAddress: string
  condition?: PresetCondition
} & ExecutionFlags

export type PresetAllowEntry = PresetFullyClearedTarget | PresetFunction

export type ComparisonValue = string | Placeholder<any>

export interface PresetCondition {
  paramType: ParameterType
  operator: Operator
  compValue?: ComparisonValue
  children?: PresetCondition[]
}
