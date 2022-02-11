import RoleMember from "./RoleMember"
import { MenuEntity } from "../MenuEntity"
import { EntityStatus } from "../../../../typings/role"

interface RoleMembersProps {
  members: string[]

  onAdd(): void

  onRemove(member: string, remove?: boolean): void
  getStatus(member: string): EntityStatus
}

export const RoleMembers = ({ members, onAdd, onRemove, getStatus }: RoleMembersProps) => {
  return (
    <MenuEntity
      list={members}
      name={{ singular: "Member", plural: "Members" }}
      onAdd={onAdd}
      renderItem={(member) => (
        <RoleMember key={member} member={member} status={getStatus(member)} onRemoveMember={onRemove} />
      )}
    />
  )
}
