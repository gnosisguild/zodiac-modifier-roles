import { Breadcrumb } from "@/components/Layout"
import ParentPageBreadcrumbs from "../../breadcrumbs"
import Flex from "@/ui/Flex"
import { Mod, parseRoleParam } from "@/app/params"
import BreadcrumbDivider from "@/ui/BreadcrumbDivider"
import classes from "./page.module.css"
import LabeledData from "@/ui/LabeledData"

export default function PageBreadcrumbs({
  mod,
  role,
  record,
}: {
  mod: Mod
  role: string
  record: string
}) {
  const roleKey = parseRoleParam(role)
  if (!roleKey) {
    throw new Error("Invalid role param")
  }

  return (
    <>
      <ParentPageBreadcrumbs mod={mod} role={role} />
      <BreadcrumbDivider />
      <Breadcrumb
        href={`/${mod.chainPrefix}:${mod.address}/roles/${role}/record/${record}`}
        className={classes.breadcrumb}
      >
        <Flex gap={2} alignItems="center">
          <LabeledData label="Recorded calls">
            <div className={classes.hash}>{record}</div>
          </LabeledData>
        </Flex>
      </Breadcrumb>
    </>
  )
}
