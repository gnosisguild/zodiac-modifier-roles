import RoleMember from "./RoleMember"
import { MenuEntity } from "./MenuEntity"

interface RoleMembersProps {
  members: string[]

  onAdd(): void

  onRemove(member: string): void
}

export const RoleMembers = ({ members, onAdd, onRemove }: RoleMembersProps) => {
  return (
    <MenuEntity
      list={members}
      name={{ singular: "Member", plural: "Members" }}
      onAdd={onAdd}
      renderItem={(member, index) => (
        <RoleMember key={member} member={member} remove={index === 1} onRemoveMember={onRemove} />
      )}
    />
  )
}
