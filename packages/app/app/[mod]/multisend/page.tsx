import { fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"

import Layout from "@/components/Layout"
import { parseModParam } from "@/app/params"
import PageBreadcrumbs from "../breadcrumbs"
import { isGovernor } from "@/components/ApplyUpdate/ApplyViaGovernor/isGovernor"
import { isRethinkFactory } from "@/components/ApplyUpdate/ApplyViaRethinkFactory/isRethinkFactory"
import MultisendStatus from "./MultisendStatus"
import { checkUnwrappers, getOverallStatus } from "./checkUnwrappers"

export type { UnwrapperStatus } from "./checkUnwrappers"

export default async function MultisendPage(props: {
  params: Promise<{ mod: string }>
}) {
  const params = await props.params
  const mod = parseModParam(params.mod)

  if (!mod) {
    notFound()
  }

  const modInfo = await fetchRolesMod(mod)
  if (!modInfo) {
    notFound()
  }

  const unwrappers = await checkUnwrappers(
    mod.chainId,
    mod.address,
    modInfo.multiSendAddresses
  )

  const overallStatus = getOverallStatus(unwrappers)

  let applyType: "safe" | "governor" | "rethink" = "safe"
  if (overallStatus !== "correct") {
    if (await isGovernor(mod.chainId, modInfo.owner)) applyType = "governor"
    else if (await isRethinkFactory(mod.chainId, modInfo.owner))
      applyType = "rethink"
  }

  return (
    <Layout head={<PageBreadcrumbs mod={mod} />}>
      <main>
        <MultisendStatus
          unwrappers={unwrappers}
          overallStatus={overallStatus}
          rolesAddress={mod.address}
          owner={modInfo.owner}
          chainId={mod.chainId}
          applyType={applyType}
        />
      </main>
    </Layout>
  )
}
