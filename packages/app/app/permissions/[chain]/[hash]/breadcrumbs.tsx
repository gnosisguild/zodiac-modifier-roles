import { Breadcrumb } from "@/components/Layout"
import classes from "./page.module.css"
import LabeledData from "@/ui/LabeledData"

export default function PageBreadcrumbs({
  chain,
  hash,
}: {
  chain: string
  hash: string
}) {
  return (
    <Breadcrumb href={`/permissions/${chain}/${hash}`}>
      <LabeledData label="Permissions">
        <div className={classes.hash}>{hash}</div>
      </LabeledData>
    </Breadcrumb>
  )
}
