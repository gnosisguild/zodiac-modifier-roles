import {
  TargetPermission,
  FunctionPermissionCoerced,
} from "zodiac-roles-sdk/build/cjs/sdk/src/permissions/types"

export const TargetPermissionItem: React.FC<TargetPermission> = ({
  targetAddress,
  delegatecall,
  send,
}) => {
  return <span>{targetAddress}</span>
}

export const FunctionPermissionItem: React.FC<FunctionPermissionCoerced> = ({
  targetAddress,
  selector,
  condition,
  delegatecall,
  send,
}) => {
  return (
    <span>
      {targetAddress}.{selector}
    </span>
  )
}
