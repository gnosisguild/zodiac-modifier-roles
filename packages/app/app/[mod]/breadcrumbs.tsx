import { Breadcrumb } from "@/components/Layout"
import Address from "@/ui/Address"
import { Mod } from "../params"

export default function PageBreadcrumbs({ mod }: { mod: Mod }) {
  return (
    <Breadcrumb href={`/${mod.chainPrefix}:${mod.address}`}>
      <Address address={mod.address} />
    </Breadcrumb>
  )
}
