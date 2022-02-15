import RoleMember from "./RoleMember"
import { MenuEntity } from "../MenuEntity"
import { EntityStatus } from "../../../../typings/role"
import AddAddressModal from "../../../modals/AddAddressModal"
import { useContext, useState } from "react"
import { RoleContext } from "../RoleContext"

export const RoleMembers = () => {
  const { addMember, removeMember, state } = useContext(RoleContext)

  const [addMemberModalIsOpen, setAddMemberModalIsOpen] = useState(false)

  const members = [...state.members.list, ...state.members.add]

  const getMemberStatus = (member: string) => {
    if (state.members.remove.includes(member)) return EntityStatus.REMOVE
    if (state.members.add.includes(member)) return EntityStatus.PENDING
    return EntityStatus.NONE
  }

  const handleRemoveMember = (member: string, remove?: boolean) => {
    removeMember({ member, remove })
  }

  return (
    <>
      <MenuEntity
        list={members}
        name={{ singular: "Member", plural: "Members" }}
        onAdd={() => setAddMemberModalIsOpen(true)}
        renderItem={(member) => (
          <RoleMember
            key={member}
            member={member}
            status={getMemberStatus(member)}
            onRemoveMember={handleRemoveMember}
          />
        )}
      />

      <AddAddressModal
        type="Member"
        isOpen={addMemberModalIsOpen}
        onAddAddress={addMember}
        onClose={() => setAddMemberModalIsOpen(false)}
      />
    </>
  )
}
