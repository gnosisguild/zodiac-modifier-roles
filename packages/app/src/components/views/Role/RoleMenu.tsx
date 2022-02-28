import { Box, Button, CircularProgress, Link, Tooltip, Typography } from "@material-ui/core"
import ButtonLink from "../../commons/input/ButtonLink"
import { AddSharp, ArrowBackSharp } from "@material-ui/icons"
import { useRootDispatch, useRootSelector } from "../../../store"
import { getConnectedAddress, getRolesModifierAddress, getTransactionPending } from "../../../store/main/selectors"
import { Role } from "../../../typings/role"
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom"
import { RoleMembers } from "./members/RoleMembers"
import { RoleTargets } from "./targets/RoleTargets"
import { useContext, useState } from "react"
import { RoleContext } from "./RoleContext"
import { executeTransactions, getChainTx, updateRole, WalletType } from "../../../services/rolesModifierContract"
import { useWallet } from "../../../hooks/useWallet"
import { BigNumber } from "ethers"
import { setTransactionPending } from "../../../store/main/rolesSlice"
import { useFetchRoles } from "../../../hooks/useFetchRoles"
import SafeAppsSDK from "@gnosis.pm/safe-apps-sdk"
import PendingChanges from "../../modals/PendingChanges"

/**
 * Security concern: roleId crashes is possible. This uses the currently available information.
 * - for instance there can be transactions in the mempool or not yet indexed buy the subgraph
 *
 * It depends on what the owner is how bad this is...
 *
 * @returns the roleId of the current role or the largest roleId+1 of the available roles
 */
export function getRoleId(roleId: string, roles: Role[]): string {
  if (roleId === "new") {
    return (
      roles
        .map((role) => BigNumber.from(role.name)) // Convert all IDs to BigNumber
        // Get the last ID
        .reduce((biggest, current) => (biggest.lt(current) ? current : biggest), BigNumber.from(0))
        .add(1) // Add 1 to the last ID
        .toString()
    )
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

function getButtonText(role: Role | undefined, isWaiting: boolean, indexing: boolean): string {
  if (indexing) return "Indexing..."

  if (role) {
    return !isWaiting ? "Update role" : "Updating role..."
  }
  return !isWaiting ? "Create role" : "Creating role..."
}

export const RoleMenu = () => {
  const { module } = useParams()
  const { state } = useContext(RoleContext)
  const { provider, walletType } = useWallet()
  const dispatch = useRootDispatch()
  const navigate = useNavigate()

  const { fetch: fetchRoles } = useFetchRoles({ lazy: true })

  const isWaiting = useRootSelector(getTransactionPending)
  const walletAddress = useRootSelector(getConnectedAddress)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const [indexing, setIndexing] = useState(false)
  const [pendingChangesModalIsOpen, setPendingChangesModalIsOpen] = useState(false)

  const handleExecuteUpdate = async () => {
    if (!rolesModifierAddress) return

    dispatch(setTransactionPending(true))
    try {
      const txs = await updateRole(rolesModifierAddress, state)
      const tx = await executeTransactions(walletType, txs)

      if (walletType === WalletType.GNOSIS_SAFE) {
        const safeSDK = new SafeAppsSDK()
        const info = await safeSDK.safe.getInfo()
        if (info.threshold > 1) {
          // Transaction are not executed immediately
          return
        }

        const txHash = await getChainTx(tx?.safeTxHash || "")
        setIndexing(true)
        if (provider) {
          // Wait for 3 confirmations
          await provider.waitForTransaction(txHash, 3)
        } else {
          // Wait 10s to wait for a few confirmations
          await new Promise((resolve) => setTimeout(resolve, 10000))
        }
      } else {
        setIndexing(true)
        // Wait 5s to wait to the subgraph to index new txs
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }

      if (!state.role) {
        // If role === undefined, it's created
        navigate(`/${module}/roles/${state.id}`)
      } else {
        fetchRoles()
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      dispatch(setTransactionPending(false))
      setIndexing(false)
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
      {getButtonText(state.role, isWaiting, indexing)}
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
      <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", mt: "auto", mb: 2 }}>
        <Link onClick={() => setPendingChangesModalIsOpen(true)} underline="always">
          <ButtonLink text={"View pending changes"} />
        </Link>
      </Box>

      {walletAddress ? (
        button
      ) : (
        // TODO (carlos): Add styling
        <Tooltip title="You must connect your wallet before creating a role.">
          <div>{button}</div>
        </Tooltip>
      )}
      <PendingChanges isOpen={pendingChangesModalIsOpen} onClose={() => setPendingChangesModalIsOpen(false)} />
    </Box>
  )
}
