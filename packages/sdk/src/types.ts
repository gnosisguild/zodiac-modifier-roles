export {
  Permission,
  PermissionCoerced,
  PermissionSet,
} from "./permissions/types"
export { Scoping } from "./permissions/authoring/conditions/types"

export interface Allowance {
  key: `0x${string}`
  period: number
  refill: bigint
  timestamp: number
  maxRefill: bigint
  balance: bigint
}
