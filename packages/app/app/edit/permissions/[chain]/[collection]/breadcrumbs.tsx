import { Breadcrumb } from "@/components/Layout"
import Address from "@/ui/Address"
import { Mod } from "../params"
import classes from "./page.module.css"

export default function PageBreadcrumbs({
  chain,
  collectionId,
}: {
  chain
  collectionId
}) {
  return (
    <Breadcrumb href={`/permissions/${chain}/${collectionId}`}>
      <LabeledData label="Permissions">
        <div className={classes.hash}>{hash}</div>
      </LabeledData>
    </Breadcrumb>
  )
}
