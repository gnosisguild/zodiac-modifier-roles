import { Clearance, Role, Target } from "zodiac-roles-sdk"
import { Suspense } from "react"
import TabGroup from "@/ui/TabGroup"
import classes from "./style.module.css"
import AnnotationsToggle from "../AnnotationsToggle"
import PermissionsDiff from "../permissions/PermissionsDiff"
import { ChainId } from "@/app/chains"
import { PermissionsPost } from "@/app/api/permissions/types"
import MembersDiff from "../members/MembersDiff"

interface Props {
  left: Role | PermissionsPost
  right: Role | PermissionsPost
  chainId: ChainId
  showAnnotations: boolean
}

const DiffView: React.FC<Props> = ({
  left,
  right,
  chainId,
  showAnnotations,
}) => {
  const hasAnnotations =
    (left.annotations && left.annotations.length > 0) ||
    (right.annotations && right.annotations.length > 0)

  const { members: leftMembers, ...leftPermissions } = processEntry(
    left,
    showAnnotations
  )

  // A permissions post may specify updates of only members or only targets. In that case we want to keep the left's state.
  const completedRight: PermissionsPost = {
    targets: right.targets || left.targets,
    annotations: right.annotations || left.annotations,
    members: right.members || left.members,
  }
  const { members: rightMembers, ...rightPermissions } = processEntry(
    completedRight,
    showAnnotations
  )

  return (
    <Suspense fallback={<DiffViewLoading />}>
      <div>
        <TabGroup
          tabs={["Permissions", "Members"]}
          panels={[
            <div className={classes.permissionsWrapper} key="permissionList">
              {hasAnnotations && (
                <div className={classes.toolbar}>
                  <AnnotationsToggle on={showAnnotations} />
                </div>
              )}
              <PermissionsDiff
                left={leftPermissions}
                right={rightPermissions}
                chainId={chainId}
              />
            </div>,
            <MembersDiff
              left={leftMembers}
              right={rightMembers}
              chainId={chainId}
              key="membersList"
            />,
          ]}
        />
      </div>
    </Suspense>
  )
}

export default DiffView

const processEntry = (
  entry: Role | PermissionsPost,
  shallShowAnnotations: boolean
) => ({
  targets: (entry.targets || []).filter(
    (target) => !isEmptyFunctionScoped(target)
  ),
  annotations: shallShowAnnotations ? entry.annotations || [] : [],
  members: entry.members || [],
})

const isEmptyFunctionScoped = (target: Target) =>
  target.clearance === Clearance.Function && target.functions.length === 0

const DiffViewLoading: React.FC = () => {
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
