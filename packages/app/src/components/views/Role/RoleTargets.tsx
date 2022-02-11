import { MenuEntity } from "./MenuEntity"
import { EntityStatus, Target } from "../../../typings/role"
import RoleTarget from "./RoleTarget"

interface RoleMembersProps {
  targets: Target[]
  target?: Target

  onAdd(): void

  onClick(target: Target): void

  onRemove(target: Target): void
  getStatus(target: string): EntityStatus
}

export const RoleTargets = ({
  targets,
  target: activeTarget,
  onAdd,
  onRemove,
  onClick,
  getStatus,
}: RoleMembersProps) => {
  return (
    <MenuEntity
      list={targets}
      name={{ singular: "Target", plural: "Targets" }}
      onAdd={onAdd}
      renderItem={(target) => (
        <RoleTarget
          key={target.id}
          status={getStatus(target.address)}
          target={target}
          onClickTarget={onClick}
          activeTarget={!!(activeTarget && activeTarget.id === target.id)}
          onRemoveTarget={onRemove}
        />
      )}
    />
  )
}
