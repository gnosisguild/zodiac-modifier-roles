import { Box, Button, CircularProgress, Typography } from "@material-ui/core"
import ButtonLink from "../../commons/input/ButtonLink"
import { AddSharp, ArrowBackSharp } from "@material-ui/icons"
import { useRootSelector } from "../../../store"
import { getTransactionPending } from "../../../store/main/selectors"
import { Role, Target } from "../../../typings/role"
import AddTargetModal from "../../modals/AddTargetModal"
import { useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import AddAddressModal from "../../modals/AddAddressModal"
import { RoleMembers } from "./RoleMembers"
import { RoleTargets } from "./RoleTargets"

interface RoleMenuProps {
  id: string
  role?: Role
  target?: Target

  members: string[]
  targets: Target[]

  onSubmit(): void

  onAddTarget(target: Target): void

  onAddMember(member: string): void

  onRemoveMember(member: string): void

  onRemoveTarget(target: Target): void

  onTarget(target: Target): void
}

const RoleMenuTitle = ({ role, id }: { id: RoleMenuProps["id"]; role: RoleMenuProps["role"] }) => {
  if (role) return <Typography variant="h5">Editing Role #{role.id}</Typography>
  return <Typography variant="h5">Create Role #{id}</Typography>
}

export const RoleMenu = ({
  id,
  role,
  target: activeTarget,
  targets,
  members,

  onTarget,
  onAddTarget,
  onAddMember,
  onRemoveMember,
  onRemoveTarget,
  onSubmit,
}: RoleMenuProps) => {
  const isWaiting = useRootSelector(getTransactionPending)

  const [addTargetModalIsOpen, setAddTargetModalIsOpen] = useState(false)
  const [addMemberModalIsOpen, setAddMemberModalIsOpen] = useState(false)

  const handleOpenAddMemberModal = () => setAddMemberModalIsOpen(true)
  const handleOpenAddTargetModal = () => setAddTargetModalIsOpen(true)

  return (
    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <Box>
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <RoleMenuTitle id={id} role={role} />
          <Box sx={{ flexGrow: 1 }} />
          <RouterLink to="/">
            <ButtonLink text="View all roles" icon={<ArrowBackSharp fontSize="small" />} />
          </RouterLink>
        </Box>
        <Box
          sx={{
            bgcolor: "rgba(217, 212, 173, 0.1)",
            height: 1,
            my: 2,
            width: "100%",
          }}
        />
        <RoleMembers members={members} onAdd={handleOpenAddMemberModal} onRemove={onRemoveMember} />
        <RoleTargets
          targets={targets}
          target={activeTarget}
          onAdd={handleOpenAddTargetModal}
          onRemove={onRemoveTarget}
          onClick={onTarget}
        />
      </Box>

      <Button
        fullWidth
        color="secondary"
        size="large"
        variant="contained"
        onClick={onSubmit}
        disabled={isWaiting}
        startIcon={isWaiting ? <CircularProgress size={18} color="primary" /> : <AddSharp />}
      >
        {role && isWaiting ? "Updating role..." : role ? "Update role" : isWaiting ? "Creating role..." : "Create role"}
      </Button>

      <AddTargetModal
        isOpen={addTargetModalIsOpen}
        onAddTarget={onAddTarget}
        onClose={() => setAddTargetModalIsOpen(false)}
      />

      <AddAddressModal
        type="Member"
        isOpen={addMemberModalIsOpen}
        onAddAddress={onAddMember}
        onClose={() => setAddMemberModalIsOpen(false)}
      />
    </Box>
  )
}
