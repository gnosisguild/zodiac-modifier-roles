import { MenuEntity } from "./MenuEntity"
import { Target } from "../../../typings/role"
import RoleTarget from "./RoleTarget"

interface RoleMembersProps {
  targets: Target[]
  target?: Target

  onAdd(): void

  onClick(target: Target): void

  onRemove(target: Target): void
  isOnRemoveQueue(target: string): boolean
}

export const RoleTargets = ({
  targets,
  target: activeTarget,
  onAdd,
  onRemove,
  onClick,
  isOnRemoveQueue,
}: RoleMembersProps) => {
  return (
    <MenuEntity
      list={targets}
      name={{ singular: "Target", plural: "Targets" }}
      onAdd={onAdd}
      renderItem={(target) => (
        <RoleTarget
          key={target.id}
          remove={isOnRemoveQueue(target.address)}
          target={target}
          onClickTarget={onClick}
          activeTarget={!!(activeTarget && activeTarget.id === target.id)}
          onRemoveTarget={onRemove}
        />
      )}
    />
  )
}
