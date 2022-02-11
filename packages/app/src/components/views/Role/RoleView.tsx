import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import TargetParameters from "./TargetConfiguration"
import { EntityStatus, Role, Target } from "../../../typings/role"
import { useRootDispatch, useRootSelector } from "../../../store"
import { getRoleById, getRoles, getRolesModifierAddress } from "../../../store/main/selectors"
import { updateRole } from "../../../services/rolesModifierContract"
import { useWallet } from "../../../hooks/useWallet"
import { Dashboard } from "../../commons/layout/Dashboard"
import { RoleMenu } from "./RoleMenu"
import { RoleNoTarget } from "./RoleNoTarget"
import { useFetchRoles } from "../../../hooks/useFetchRoles"

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

  useFetchRoles()

  useEffect(() => {
    setActiveTarget(role?.targets[0])
  }, [dispatch, roleId, role?.targets])

  const handleAddMember = (memberAddress: string) => {
    setMembersToAdd((current) => [...current, memberAddress])
  }

  const handleAddTarget = (target: Target) => {
    setTargetsToAdd((current) => [...current, target])
  }

  const handleChangeTargetExecutionOptions = ({ address: targetAddress, executionOptions: newOptions }: Target) => {
    console.log("Change execution options - not implemented yet") // TODO
  }

  const handleRemoveMember = (member: string, remove = true) => {
    if (!remove) {
      // Remove from delete queue
      setMembersToRemove((members) => members.filter((_member) => _member !== member))
      return
    }
    if (membersToRemove.includes(member)) {
      // Already in queue
      return
    }
    setMembersToRemove((members) => [...members, member])
  }

  const handleRemoveTarget = (target: Target, remove = true) => {
    console.log("remove")
    if (!remove) {
      // Remove from delete queue
      setTargetsToRemove((targets) => targets.filter((_target) => _target !== target.address))
      return
    }
    if (targetsToRemove.includes(target.address)) {
      // Already in queue
      return
    }
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

  const getMemberStatus = (address: string): EntityStatus => {
    if (membersToRemove.includes(address)) return EntityStatus.REMOVE
    if (membersToAdd.includes(address)) return EntityStatus.PENDING
    return EntityStatus.NONE
  }
  const getTargetStatus = (address: string): EntityStatus => {
    if (targetsToRemove.includes(address)) return EntityStatus.REMOVE
    if (targetsToAdd.find((target) => target.address === address)) return EntityStatus.PENDING
    return EntityStatus.NONE
  }

  return (
    <Dashboard
      left={
        <RoleMenu
          id={roleId}
          role={role}
          targets={[...(role?.targets || []), ...targetsToAdd]}
          members={[...(role?.members.map((member) => member.address) || []), ...membersToAdd]}
          getMemberStatus={getMemberStatus}
          getTargetStatus={getTargetStatus}
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
