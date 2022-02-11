import { Box, Button, CircularProgress, Typography } from "@material-ui/core"
import ButtonLink from "../../commons/input/ButtonLink"
import { AddSharp, ArrowBackSharp } from "@material-ui/icons"
import { useRootSelector } from "../../../store"
import { getTransactionPending } from "../../../store/main/selectors"
import { EntityStatus, Role, Target } from "../../../typings/role"
import AddTargetModal from "../../modals/AddTargetModal"
import { useState } from "react"
import { Link as RouterLink, useParams } from "react-router-dom"
import AddAddressModal from "../../modals/AddAddressModal"
import { RoleMembers } from "./RoleMembers"
import { RoleTargets } from "./RoleTargets"

interface RoleMenuProps {
  id: string
  role?: Role
  target?: Target

  members: string[]
  targets: Target[]

  getMemberStatus(address: string): EntityStatus
  getTargetStatus(address: string): EntityStatus

  onSubmit(): void

  onAddTarget(target: Target): void

  onAddMember(member: string): void

  onRemoveMember(member: string, remove?: boolean): void

  onRemoveTarget(target: Target, remove?: boolean): void

  onTarget(target: Target): void
}

const RoleMenuTitle = ({ role, id }: { id: RoleMenuProps["id"]; role: RoleMenuProps["role"] }) => {
  if (role) return <Typography variant="h5">Editing Role #{role.id}</Typography>
  return <Typography variant="h5">Create Role #{id}</Typography>
}

function getButtonText(role: Role | undefined, isWaiting: boolean): string {
  if (role && isWaiting) return "Updating role..."
  if (role) return "Update role"
  if (isWaiting) return "Creating role..."
  return "Create role"
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

  getMemberStatus,
  getTargetStatus,
}: RoleMenuProps) => {
  const { module } = useParams()

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
          <RouterLink to={`/${module}`}>
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
        <RoleMembers
          members={members}
          onAdd={handleOpenAddMemberModal}
          onRemove={onRemoveMember}
          getStatus={getMemberStatus}
        />
        <RoleTargets
          targets={targets}
          target={activeTarget}
          onAdd={handleOpenAddTargetModal}
          onRemove={onRemoveTarget}
          onClick={onTarget}
          getStatus={getTargetStatus}
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
        {getButtonText(role, isWaiting)}
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
