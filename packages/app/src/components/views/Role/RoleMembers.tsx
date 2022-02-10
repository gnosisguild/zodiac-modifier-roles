import RoleMember from "./RoleMember"
import { MenuEntity } from "./MenuEntity"

interface RoleMembersProps {
  members: string[]

  onAdd(): void

  onRemove(member: string, remove?: boolean): void
  isOnRemoveQueue(member: string): boolean
}

export const RoleMembers = ({ members, onAdd, onRemove, isOnRemoveQueue }: RoleMembersProps) => {
  return (
    <MenuEntity
      list={members}
      name={{ singular: "Member", plural: "Members" }}
      onAdd={onAdd}
      renderItem={(member, index) => (
        <RoleMember key={member} member={member} remove={isOnRemoveQueue(member)} onRemoveMember={onRemove} />
      )}
    />
  )
}
