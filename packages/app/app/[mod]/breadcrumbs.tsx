import { Breadcrumb } from "@/components/Layout"
import Address from "@/ui/Address"
import { parseModParam } from "../params"

export default function PageBreadcrumbs({ mod }: { mod: string }) {
  const parsed = parseModParam(mod)
  if (!parsed) {
    throw new Error("Invalid mod param")
  }
  return (
    <Breadcrumb href={`/${decodeURIComponent(mod)}`}>
      <Address address={parsed.address} />
    </Breadcrumb>
  )
}
