import { Breadcrumb } from "@/components/Layout"
import styles from "./page.module.css"
import ParentPageBreadcrumbs from "../../breadcrumbs"
import Flex from "@/ui/Flex"
import { Mod, parseRoleParam } from "@/app/params"

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
      <ParentPageBreadcrumbs mod={mod} />
      <Breadcrumb href={`/${mod.chainPrefix}:${mod.address}/roles/${role}`}>
        <Flex direction="column" gap={0}>
          {role !== roleKey ? role : null}
          <Flex gap={0} alignItems="center" className={styles.roleKey}>
            <small>{roleKey}</small>
          </Flex>
        </Flex>
      </Breadcrumb>
    </>
  )
}
