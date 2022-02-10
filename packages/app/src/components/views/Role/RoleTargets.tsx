import { MenuEntity } from "./MenuEntity"
import { Target } from "../../../typings/role"
import RoleTarget from "./RoleTarget"

interface RoleMembersProps {
  targets: Target[]
  target?: Target

  onAdd(): void

  onClick(target: Target): void

  onRemove(member: Target): void
}

export const RoleTargets = ({ targets, target: activeTarget, onAdd, onRemove, onClick }: RoleMembersProps) => {
  return (
    <MenuEntity
      list={targets}
      name={{ singular: "Target", plural: "Targets" }}
      onAdd={onAdd}
      renderItem={(target, index) => (
        <RoleTarget
          key={target.id}
          remove={index === 1}
          target={target}
          onClickTarget={onClick}
          activeTarget={!!(activeTarget && activeTarget.id === target.id)}
          onRemoveTarget={onRemove}
        />
      )}
    />
  )
}
