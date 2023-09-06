import { BytesLike, ParamType } from "ethers/lib/utils"

import { Annotation, Condition } from "../types"

import { ConditionFunction } from "./authoring/conditions/types"

export type AbiType = string | ParamType

export interface ExecutionFlags {
  send?: boolean
  delegatecall?: boolean
}

// allows call to any function on the target addresses
export type TargetPermission = {
  targetAddress: string
} & ExecutionFlags

// allows calls to specific functions, optionally with parameter scoping
export type FunctionPermission = (
  | { selector: string }
  | { signature: string }
) & {
  targetAddress: string
  condition?: Condition | ConditionFunction<BytesLike> // condition entrypoint can be a condition function that will be invoked with `bytes` abiType (undecoded calldata)
} & ExecutionFlags

export type FunctionPermissionCoerced = {
  selector: string
  targetAddress: string
  condition?: Condition
} & ExecutionFlags

export type Permission = TargetPermission | FunctionPermission
export type PermissionCoerced = TargetPermission | FunctionPermissionCoerced

export type PermissionSet = Permission[] & { annotation?: Annotation }
