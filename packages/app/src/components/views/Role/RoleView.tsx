import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import TargetParameters from "./TargetConfiguration"
import { Role, Target } from "../../../typings/role"
import { useRootDispatch, useRootSelector } from "../../../store"
import { getRoleById, getRoles, getRolesModifierAddress } from "../../../store/main/selectors"
import { fetchRoles } from "../../../store/main/rolesSlice"
import { updateRole } from "../../../services/rolesModifierContract"
import { useWallet } from "../../../hooks/useWallet"
import { Dashboard } from "../../commons/layout/Dashboard"
import { RoleMenu } from "./RoleMenu"
import { RoleNoTarget } from "./RoleNoTarget"

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
    return Math.max(...roles.map((role) => parseInt(role.id) + 1)).toString()
  } else {
    return roleId
  }
}

const RoleView = () => {
  const dispatch = useRootDispatch()

  const { roleId = "new" } = useParams()
  const { provider, walletType } = useWallet()

  const roles = useRootSelector(getRoles)
  const role = useRootSelector(getRoleById(roleId))
  const rolesModifierAddress = useRootSelector(getRolesModifierAddress)

  const [activeTarget, setActiveTarget] = useState<Target>()
  const [targetsToAdd, setTargetsToAdd] = useState<Target[]>([])
  const [membersToAdd, setMembersToAdd] = useState<string[]>([])
  const [membersToRemove, setMembersToRemove] = useState<string[]>([])
  const [targetsToRemove, setTargetsToRemove] = useState<string[]>([])

  useEffect(() => {
    dispatch(fetchRoles())
    setActiveTarget(role?.targets[0])
  }, [dispatch, roleId, role?.targets])

  const handleAddMember = (memberAddress: string) => {
    setMembersToAdd((current) => [...current, memberAddress])
  }

  const handleAddTarget = (target: Target) => {
    setTargetsToAdd((current) => [...current, target])
  }

  const handleChangeTargetExecutionOptions = ({ address: targetAddress, executionOption: newOptions }: Target) => {
    console.log("Change execution options - not implemented yet") // TODO
  }

  const handleRemoveMember = (member: string) => {
    setMembersToRemove(membersToRemove.filter((address) => member !== address))
  }

  const handleRemoveTarget = (target: Target) => {
    setTargetsToRemove((targetsToRemove) => [...targetsToRemove, target.address])
  }

  const handleExecuteUpdate = async () => {
    if (!provider || !rolesModifierAddress || !roleId) return
    try {
      await updateRole(
        provider,
        walletType,
        rolesModifierAddress,
        getRoleId(roleId, roles),
        membersToAdd,
        membersToRemove,
        targetsToAdd,
        targetsToRemove,
      )
    } catch (error: any) {
      console.error(error)
    }
  }

  return (
    <Dashboard
      left={
        <RoleMenu
          id={roleId}
          role={role}
          targets={[...(role?.targets || []), ...targetsToAdd]}
          members={[...(role?.members.map((member) => member.address) || []), ...membersToAdd]}
          target={activeTarget}
          onTarget={setActiveTarget}
          onSubmit={handleExecuteUpdate}
          onAddMember={handleAddMember}
          onAddTarget={handleAddTarget}
          onRemoveMember={handleRemoveMember}
          onRemoveTarget={handleRemoveTarget}
        />
      }
    >
      {activeTarget ? (
        <TargetParameters target={activeTarget} onChangeTargetExecutionsOptions={handleChangeTargetExecutionOptions} />
      ) : (
        <RoleNoTarget />
      )}
    </Dashboard>
  )
}

export default RoleView
