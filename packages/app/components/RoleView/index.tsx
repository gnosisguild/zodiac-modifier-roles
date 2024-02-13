import { fetchOrInitRole } from "@/components/RoleView/fetching"
import { Mod } from "@/app/params"
import TabGroup from "@/ui/TabGroup"
import PermissionsList from "../permissions/PermissionsList"
import MembersList from "../MembersList"
import { Suspense } from "react"
import classes from "./style.module.css"

interface RoleViewProps {
  mod: Mod
  roleKey: `0x${string}`
}

const RoleView: React.FC<RoleViewProps> = async ({ mod, roleKey }) => {
  let data = await fetchOrInitRole({ ...mod, roleKey })
  return (
    <Suspense fallback={<RoleViewLoading />}>
      <TabGroup
        tabs={["Permissions", "Members"]}
        panels={[
          <PermissionsList
            targets={data.targets}
            annotations={data.annotations}
            chainId={mod.chainId}
            key={`permissionList-${roleKey}`}
          />,
          <MembersList
            members={data.members}
            chainId={mod.chainId}
            key={`memberList-${roleKey}`}
          />,
        ]}
      />
    </Suspense>
  )
}

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
