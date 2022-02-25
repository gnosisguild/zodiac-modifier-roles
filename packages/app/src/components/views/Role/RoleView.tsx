import { useParams } from "react-router-dom"
import TargetParameters from "./targets/TargetConfiguration"
import { Target } from "../../../typings/role"
import { useRootSelector } from "../../../store"
import { getRoleById } from "../../../store/main/selectors"
import { Dashboard } from "../../commons/layout/Dashboard"
import { RoleMenu } from "./RoleMenu"
import { RoleNoTarget } from "./RoleNoTarget"
import { useFetchRoles } from "../../../hooks/useFetchRoles"
import { RoleContext, RoleContextWrap } from "./RoleContext"

const RoleView = () => {
  const { roleId = "new" } = useParams()

  const role = useRootSelector(getRoleById(roleId))

  useFetchRoles()

  const handleTargetChange = (target: Target) => {
    console.log("target", target) // TODO
  }

  return (
    <RoleContextWrap role={role} id={roleId}>
      <Dashboard left={<RoleMenu />}>
        <RoleContext.Consumer>
          {({ state }) =>
            state.activeTarget ? (
              <TargetParameters target={state.getActiveRole()} onChange={handleTargetChange} />
            ) : (
              <RoleNoTarget />
            )
          }
        </RoleContext.Consumer>
      </Dashboard>
    </RoleContextWrap>
  )
}

export default RoleView
