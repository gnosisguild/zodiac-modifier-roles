import { Breadcrumb } from "@/components/Layout"
import { VscGitCompare } from "react-icons/vsc"
import ParentPageBreadcrumbs from "../../breadcrumbs"
import Flex from "@/ui/Flex"
import LabeledData from "@/ui/LabeledData"
import styles from "./page.module.css"

export default function PageBreadcrumbs({
  chain,
  hash,
  hashRight,
}: {
  chain: string
  hash: string
  hashRight: string
}) {
  return (
    <>
      <ParentPageBreadcrumbs chain={chain} hash={hash} />
      <Breadcrumb href={`/permissions/${chain}/${hash}/diff/${hashRight}`}>
        <VscGitCompare title="Diff" />
      </Breadcrumb>
      <Breadcrumb href={`/permissions/${chain}/${hashRight}`}>
        <Flex gap={2} alignItems="center">
          <LabeledData label="Permissions">
            <div className={styles.hash}>{hashRight}</div>
          </LabeledData>
        </Flex>
      </Breadcrumb>
    </>
  )
}
