import { BytesLike, ParamType } from "ethers/lib/utils"

import { Condition } from "../types"

import { ConditionFunction } from "./authoring/conditions/types"

export type AbiType = string | ParamType

export interface ExecutionFlags {
  send?: boolean
  delegatecall?: boolean
}

export interface Preset {
  allow: PresetAllowEntry[]
  /** The ID of the chain this preset is designed for. */
  chainId: number
}

// allows call to any function on the target addresses
export type PresetFullyClearedTarget = {
  targetAddress: string
} & ExecutionFlags

// allows calls to specific functions, optionally with parameter scoping
export type PresetFunction = ({ selector: string } | { signature: string }) & {
  targetAddress: string
  condition?: Condition | ConditionFunction<BytesLike> // condition entrypoint can be a condition function that will be invoked with `bytes` abiType (undecoded calldata)
} & ExecutionFlags

export type PresetFunctionCoerced = {
  selector: string
  targetAddress: string
  condition?: Condition
} & ExecutionFlags

export type PresetAllowEntry = PresetFullyClearedTarget | PresetFunction
export type PresetAllowEntryCoerced =
  | PresetFullyClearedTarget
  | PresetFunctionCoerced
