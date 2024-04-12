import { Breadcrumb } from "@/components/Layout"
import { VscGitCompare } from "react-icons/vsc"
import ParentPageBreadcrumbs from "../../breadcrumbs"
import Flex from "@/ui/Flex"
import { Mod } from "@/app/params"
import BreadcrumbDivider from "@/ui/BreadcrumbDivider"
import LabeledData from "@/ui/LabeledData"
import styles from "./page.module.css"

export default function PageBreadcrumbs({
  mod,
  role,
  hash,
}: {
  mod: Mod
  role: string
  hash: string
}) {
  return (
    <>
      <ParentPageBreadcrumbs mod={mod} role={role} />
      <Breadcrumb
        href={`/${mod.chainPrefix}:${mod.address}/roles/${role}/diff/${hash}`}
      >
        <VscGitCompare title="Diff" />
      </Breadcrumb>
      <Breadcrumb href={`/permissions/${mod.chainPrefix}/${hash}`}>
        <Flex gap={2} alignItems="center">
          <LabeledData label="Permissions">
            <div className={styles.hash}>{hash}</div>
          </LabeledData>
        </Flex>
      </Breadcrumb>
    </>
  )
}
