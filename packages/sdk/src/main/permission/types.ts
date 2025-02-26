import { BytesLike } from "ethers"
import { Annotation, Condition } from "zodiac-roles-deployments"

import { ConditionFunction } from "../target/authoring/types"

export interface ExecutionFlags {
  send?: boolean
  delegatecall?: boolean
}

// allows call to any function on the target addresses
export type TargetPermission = {
  targetAddress: `0x${string}`
} & ExecutionFlags

// allows calls to specific functions, optionally with parameter scoping
export type FunctionPermission = (
  | { selector: `0x${string}` }
  | { signature: string }
) & {
  targetAddress: `0x${string}`
  condition?: Condition | ConditionFunction<BytesLike> // condition entrypoint can be a condition function that will be invoked with `bytes` abiType (undecoded calldata)
} & ExecutionFlags

export type FunctionPermissionCoerced = {
  selector: `0x${string}`
  targetAddress: `0x${string}`
  condition?: Condition
} & ExecutionFlags

export type Permission = TargetPermission | FunctionPermission
export type PermissionCoerced = TargetPermission | FunctionPermissionCoerced

export type PermissionSet = Permission[] & { annotation?: Annotation }
