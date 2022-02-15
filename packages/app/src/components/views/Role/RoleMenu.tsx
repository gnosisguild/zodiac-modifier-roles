import { Box, Button, CircularProgress, Tooltip, Typography } from "@material-ui/core"
import ButtonLink from "../../commons/input/ButtonLink"
import { AddSharp, ArrowBackSharp } from "@material-ui/icons"
import { useRootSelector } from "../../../store"
import {
  getConnectedAddress,
  getRoles,
  getRolesModifierAddress,
  getTransactionPending,
} from "../../../store/main/selectors"
import { Role } from "../../../typings/role"
import { Link as RouterLink, useParams } from "react-router-dom"
import { RoleMembers } from "./members/RoleMembers"
import { RoleTargets } from "./targets/RoleTargets"
import { useContext } from "react"
import { RoleContext } from "./RoleContext"
import { updateRole } from "../../../services/rolesModifierContract"
import { useWallet } from "../../../hooks/useWallet"

/**
 * Security concern: roleId crashes is possible. This uses the currently available information.
 * - for instance there can be transactions in the mempool or not yet indexed buy the subgraph
 *
 * It depends on what the owner is how bad this is...
 *
 * @returns the roleId of the current role or the largest roleId+1 of the available roles
 */
function getRoleId(roleId: string, roles: Role[]): string {
  if (roleId === "new") {
    return Math.max(...roles.map((role) => parseInt(role.name) + 1)).toString()
  } else {
    return roleId
  }
}

const RoleMenuTitle = ({ role, id }: { id: string; role?: Role }) => {
  if (role)
    return (
      <Typography variant="h5" style={{ wordBreak: "break-all" }}>
        Editing Role #{role.name}
      </Typography>
    )
  return (
    <Typography variant="h5" style={{ wordBreak: "break-all" }}>
      Create Role #{id}
    </Typography>
  )
}

function getButtonText(role: Role | undefined, isWaiting: boolean): string {
  if (role && isWaiting) return "Updating role..."
  if (role) return "Update role"
  if (isWaiting) return "Creating role..."
  return "Create role"
}

export const RoleMenu = () => {
  const { module } = useParams()
  const { state } = useContext(RoleContext)
  const { walletType } = useWallet()

  const roles = useRootSelector(getRoles)
  const isWaiting = useRootSelector(getTransactionPending)
  const walletAddress = useRootSelector(getConnectedAddress)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const handleExecuteUpdate = async () => {
    console.log("rolesModifierAddress", rolesModifierAddress)
    if (!rolesModifierAddress) return
    try {
      await updateRole(walletType, rolesModifierAddress, getRoleId(state.id, roles), state)
    } catch (error: any) {
      console.error(error)
    }
  }

  const button = (
    <Button
      fullWidth
      color="secondary"
      size="large"
      variant="contained"
      onClick={handleExecuteUpdate}
      disabled={isWaiting || !walletAddress}
      startIcon={isWaiting ? <CircularProgress size={18} color="primary" /> : <AddSharp />}
    >
      {getButtonText(state.role, isWaiting)}
    </Button>
  )

  return (
    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <Box>
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <RoleMenuTitle id={state.id} role={state.role} />
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ minWidth: 128 }}>
            <RouterLink to={`/${module}`}>
              <ButtonLink text="View all roles" icon={<ArrowBackSharp fontSize="small" />} />
            </RouterLink>
          </Box>
        </Box>
        <Box
          sx={{
            bgcolor: "rgba(217, 212, 173, 0.1)",
            height: 1,
            my: 2,
            width: "100%",
          }}
        />
        <RoleMembers />
        <RoleTargets />
      </Box>

      {walletAddress ? (
        button
      ) : (
        <Tooltip title="You must connect your wallet before creating a role.">
          <div>{button}</div>
        </Tooltip>
      )}
    </Box>
  )
}
