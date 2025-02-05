import { Breadcrumb } from "@/components/Layout"
import classes from "./page.module.css"
import LabeledData from "@/ui/LabeledData"
import { ChainId } from "@/app/chains"

export default function PageBreadcrumbs({
  chain,
  record,
}: {
  chain: string
  record: string
}) {
  return (
    <Breadcrumb href={`/edit/permissions/${chain}/${record}`}>
      <LabeledData label="Call Record">
        <div className={classes.hash}>{record}</div>
      </LabeledData>
    </Breadcrumb>
  )
}
