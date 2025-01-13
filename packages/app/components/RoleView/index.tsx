import { Role } from "zodiac-roles-sdk"
import { Suspense } from "react"
import { Mod } from "@/app/params"
import TabGroup from "@/ui/TabGroup"
import PermissionsList from "../permissions/PermissionsList"
import MembersList from "../members/MembersList"
import classes from "./style.module.css"
import AnnotationsToggle from "../AnnotationsToggle"

type RoleViewProps = {
  mod: Mod
  role: Role
  showAnnotations: boolean
}

const RoleView: React.FC<RoleViewProps> = ({ mod, role, showAnnotations }) => (
  <Suspense fallback={<RoleViewLoading />}>
    <TabGroup
      tabs={["Permissions", "Members"]}
      panels={[
        <div className={classes.permissionsWrapper} key="permissionList">
          {role.annotations.length > 0 && (
            <div className={classes.toolbar}>
              <AnnotationsToggle on={showAnnotations} />
            </div>
          )}
          <PermissionsList
            targets={role.targets}
            annotations={showAnnotations ? role.annotations : []}
            chainId={mod.chainId}
          />
        </div>,
        <MembersList
          members={role.members}
          chainId={mod.chainId}
          key="membersList"
        />,
      ]}
    />
  </Suspense>
)

export default RoleView

const RoleViewLoading: React.FC = () => {
  return (
    <div className={classes.loading}>
      <ul>
        <li>Permissions</li>
        <li>Members</li>
      </ul>
      <div className={classes.placeholder} />
    </div>
  )
}
