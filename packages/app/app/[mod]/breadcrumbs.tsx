import { Breadcrumb } from "@/components/Layout"
import Address from "@/ui/Address"
import { Mod } from "../params"
import classes from "./page.module.css"

export default function PageBreadcrumbs({
  mod,
  isLink = false,
}: {
  mod: Mod
  isLink?: boolean
}) {
  return (
    <Breadcrumb
      href={isLink ? `/${mod.chainPrefix}:${mod.address}` : undefined}
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
