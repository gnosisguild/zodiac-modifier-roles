import { Breadcrumb } from "@/components/Layout"
import ParentPageBreadcrumbs from "../../breadcrumbs"
import Flex from "@/ui/Flex"
import { Mod, parseRoleParam } from "@/app/params"
import BreadcrumbDivider from "@/ui/BreadcrumbDivider"
import classes from "./page.module.css"

export default function PageBreadcrumbs({
  mod,
  role,
}: {
  mod: Mod
  role: string
}) {
  const roleKey = parseRoleParam(role)
  if (!roleKey) {
    throw new Error("Invalid role param")
  }

  return (
    <>
      <ParentPageBreadcrumbs mod={mod} isLink={true} />
      <BreadcrumbDivider />
      <Breadcrumb
        href={`/${mod.chainPrefix}:${mod.address}/roles/${role}`}
        className={classes.breadcrumb}
      >
        <label>Role</label>
        <Flex direction="column" gap={0}>
          {role && role !== roleKey ? (
            <div className={classes.roleName}>{role}</div>
          ) : (
            <small>{roleKey}</small>
          )}
        </Flex>
      </Breadcrumb>
    </>
  )
}
