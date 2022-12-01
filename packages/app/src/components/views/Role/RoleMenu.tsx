/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Button, CircularProgress, Link, Tooltip, Typography } from "@material-ui/core"
import ButtonLink from "../../commons/input/ButtonLink"
import { AddSharp, ArrowBackSharp, CheckSharp } from "@material-ui/icons"
import { useRootDispatch, useRootSelector } from "../../../store"
import {
  getChainId,
  getConnectedAddress,
  getRolesModifierAddress,
  getTransactionPending,
} from "../../../store/main/selectors"
import { Role, Target } from "../../../typings/role"
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom"
import { RoleMembers } from "./members/RoleMembers"
import { RoleTargets } from "./targets/RoleTargets"
import { useContext, useEffect, useState } from "react"
import { RoleContext } from "./RoleContext"
import {
  executeTxsGnosisSafe,
  executeTxsInjectedProvider,
  getSafeTx,
  updateRole,
  WalletType,
} from "../../../services/rolesModifierContract"
import { useWallet } from "../../../hooks/useWallet"
import { BigNumber } from "ethers"
import { setTransactionPending } from "../../../store/main/rolesSlice"
import { useFetchRoles } from "../../../hooks/useFetchRoles"
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

function getButtonText(
  role: Role | undefined,
  isWaiting: boolean,
  indexing: boolean,
  txProposedInSafe: boolean,
): string {
  if (indexing) return "Indexing..."

  if (role) {
    if (txProposedInSafe) return "Update transaction proposed to the Safe"
    return !isWaiting ? "Update role" : "Updating role..."
  }
  if (txProposedInSafe) return "Role creation transaction proposed to the Safe"
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
  const network = useRootSelector(getChainId)
  const walletAddress = useRootSelector(getConnectedAddress)
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const [indexing, setIndexing] = useState(false)
  const [txProposedInSafe, setTxProposedInSafe] = useState(false)
  const [pendingChangesModalIsOpen, setPendingChangesModalIsOpen] = useState(false)
  const [memberChanges, setMemberChanges] = useState<boolean>(false)
  const [targetChanges, setTargetChanges] = useState<boolean>(false)

  useEffect(() => {
    if (state) {
      const { members, targets } = state
      handleMemberChanges(members)
      handleTargetChanges(targets)
    }
  }, [state])

  const handleMemberChanges = (members: { list: string[]; add: string[]; remove: string[] }) => {
    if (!members.add.length && !members.remove.length) {
      setMemberChanges(false)
      return
    }
    setMemberChanges(true)
  }

  const handleTargetChanges = (targets: { list: Target[]; add: Target[]; remove: string[] }) => {
    const targetsToUpdate = targets.list
      .filter(({ address }) => !targets.remove.includes(address))
      .filter(({ id }) => state.getTargetUpdate(id)?.length)

    if (!targets.add.length && !targetsToUpdate.length && !targets.remove.length) {
      setTargetChanges(false)
      return
    }
    setTargetChanges(true)
  }

  const handleExecuteUpdate = async () => {
    if (!rolesModifierAddress) return

    dispatch(setTransactionPending(true))
    try {
      const txs = await updateRole(rolesModifierAddress, network, state)

      switch (walletType) {
        case WalletType.GNOSIS_SAFE: {
          let txHash = await executeTxsGnosisSafe(txs)
          let tx = await getSafeTx(txHash)
          // Possible statuses: 'AWAITING_CONFIRMATIONS' | 'AWAITING_EXECUTION' | 'CANCELLED' | 'FAILED' | 'SUCCESS' | 'PENDING' | 'PENDING_FAILED' | 'WILL_BE_REPLACED';

          // wait while tx status is PENDING
          while (["PENDING", "AWAITING_CONFIRMATIONS"].includes(tx.txStatus)) {
            await new Promise((resolve) => setTimeout(resolve, 5000))
            tx = await getSafeTx(txHash)
          }

          // if the transaction is submitted to the safe but not executed
          if (["AWAITING_EXECUTION"].includes(tx.txStatus)) {
            console.log("transaction proposed but not executed")
            setTxProposedInSafe(true)
          }
          // if transaction is executed immediately with success
          else if (tx.txStatus === "SUCCESS" && tx.txHash) {
            setIndexing(true)
            if (provider) {
              // Wait for 3 confirmations
              await provider.waitForTransaction(tx.txHash, 3)
            } else {
              // Wait 15s to wait for a few confirmations
              await new Promise((resolve) => setTimeout(resolve, 15000))
            }
          } else {
            throw Error(`Unknown status of transaction: ${tx.txStatus}`)
          }
          break
        }
        case WalletType.INJECTED: {
          await executeTxsInjectedProvider(txs)
          setIndexing(true)
          // Wait 5s to wait to the subgraph to index new txs
          await new Promise((resolve) => setTimeout(resolve, 5000))
          break
        }
        case WalletType.ZODIAC_PILOT: {
          throw Error("Sending transactions via the zodiac pilot in not yet supported")
        }
      }

      if (!txProposedInSafe) {
        if (!state.role) {
          // If role === undefined, it's created a new role
          navigate(`/${module}/roles/${state.id}`)
        } else {
          fetchRoles()
        }
      }
    } catch (error: any) {
      console.error(error)
    } finally {
      dispatch(setTransactionPending(false))
      setIndexing(false)
    }
  }

  const handleIsDisabled = (): boolean => !memberChanges && !targetChanges
  const button = (
    <Button
      fullWidth
      color="secondary"
      size="large"
      variant="contained"
      onClick={handleExecuteUpdate}
      disabled={isWaiting || !walletAddress || txProposedInSafe || handleIsDisabled()}
      startIcon={
        txProposedInSafe ? <CheckSharp /> : isWaiting ? <CircularProgress size={18} color="primary" /> : <AddSharp />
      }
    >
      {getButtonText(state.role, isWaiting, indexing, txProposedInSafe)}
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
        {txProposedInSafe ? (
          <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
            <Typography variant="body1" align="center">
              Your transaction is proposed to the Gnosis Safe
              <br />
              it can be executed in the Safe when its signed by
              <br />
              the required amounts of owners.
              <br />
              <br />
              You can safely leave this page.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <RouterLink to={`/${module}`}>
                <ButtonLink icon={<ArrowBackSharp fontSize="small" />} text="Go back to Roles" />
              </RouterLink>
            </Box>
          </Box>
        ) : (
          <>
            <RoleMembers />
            <RoleTargets />
          </>
        )}
      </Box>
      {(memberChanges || targetChanges) && !txProposedInSafe && (
        <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", mt: "auto", mb: 2 }}>
          <Link onClick={() => setPendingChangesModalIsOpen(true)} underline="always">
            <ButtonLink text={"View pending changes"} />
          </Link>
        </Box>
      )}

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
