import { useParams } from "react-router-dom"
import { TargetConfiguration } from "./targets/TargetConfiguration"
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

  return (
    <RoleContextWrap role={role} id={roleId}>
      <Dashboard left={<RoleMenu />}>
        <RoleContext.Consumer>
          {({ state }) => {
            const target = state.activeTarget && state.getActiveRole()
            return target ? <TargetConfiguration target={target} /> : <RoleNoTarget />
          }}
        </RoleContext.Consumer>
      </Dashboard>
    </RoleContextWrap>
  )
}

export default RoleView
