import { Breadcrumb } from "@/components/Layout"
import Address from "@/ui/Address"
import { Mod } from "../params"
import classes from "./page.module.css"

export default function PageBreadcrumbs({ mod }: { mod: Mod }) {
  return (
    <Breadcrumb
      href={`/${mod.chainPrefix}:${mod.address}`}
      className={classes.breadcrumb}
    >
      <label>Roles Instance</label>
      <Address
        address={mod.address}
        blockieClassName={classes.blockie}
        className={classes.addressContainer}
      />
    </Breadcrumb>
  )
}
