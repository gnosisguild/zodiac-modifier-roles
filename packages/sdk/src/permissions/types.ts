import { BytesLike, ParamType } from "ethers"
import { Annotation, Condition } from "zodiac-roles-deployments"

import { ConditionFunction } from "./authoring/conditions/types"

export type AbiType = string | ParamType

export interface ExecutionFlags {
  send?: boolean
  delegatecall?: boolean
}

export type Permission = {
  targetAddress: `0x${string}`
  selector?: `0x${string}`
  condition?: Condition
} & ExecutionFlags

export type StatedPermission = {
  targetAddress: `0x${string}`
} & (
  | { selector: `0x${string}`; condition?: StatedCondition }
  | { signature: string; condition?: StatedCondition }
  | {}
) &
  ExecutionFlags

export type PermissionSet = StatedPermission[] & { annotation?: Annotation }

type StatedCondition = Condition | ConditionFunction<BytesLike> // condition entrypoint can be a condition function that will be invoked with `bytes` abiType (undecoded calldata)
