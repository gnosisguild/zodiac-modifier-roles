import { Breadcrumb } from "@/components/Layout"
import { VscGitCompare } from "react-icons/vsc"
import ParentPageBreadcrumbs from "../../breadcrumbs"
import Flex from "@/ui/Flex"
import { MdOutlinePolicy } from "react-icons/md"
import styles from "./page.module.css"

export default function PageBreadcrumbs({
  mod,
  role,
  hash,
}: {
  mod: string
  role: string
  hash: string
}) {
  return (
    <>
      <ParentPageBreadcrumbs mod={mod} role={role} />
      <div className={styles.diffIcon}>
        <VscGitCompare />
      </div>
      <Breadcrumb
        href={`/${decodeURIComponent(mod)}/roles/${role}/diff/${hash}`}
      >
        <Flex gap={2} alignItems="center">
          <MdOutlinePolicy />
          <code className={styles.hash}>{hash}</code>
        </Flex>
      </Breadcrumb>
    </>
  )
}
