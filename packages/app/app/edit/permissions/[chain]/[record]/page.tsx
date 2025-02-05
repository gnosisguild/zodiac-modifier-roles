import { fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"

import classes from "./page.module.css"
import { parseModParam } from "@/app/params"
import RolesList from "@/components/RolesList"
import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import Address from "@/ui/Address"
import ChainIcon from "@/ui/ChainIcon"
import Flex from "@/ui/Flex"
import LabeledData from "@/ui/LabeledData"
import { CHAINS } from "@/app/chains"

export default async function EditPermissionsPage({
  params,
}: {
  params: { chain: string; record: string }
}) {
  const mod = parseModParam(params.record)
  if (!mod) {
    notFound()
  }

  const data = await fetchRolesMod(mod, { next: { revalidate: 1 } })
  if (!data) {
    notFound()
  }

  return (
    <Layout head={<PageBreadcrumbs mod={mod} />}>
      <main>
        <div className={classes.header}>
          <LabeledData label="Roles Instance">
            <h1>
              <Address
                address={mod.address}
                chainId={mod.chainId}
                explorerLink
                copyToClipboard
                displayFull
                blockieClassName={classes.modBlockie}
                addressClassName={classes.modAddress}
              />
            </h1>
          </LabeledData>
          <LabeledData label="Chain">
            <Flex gap={2} alignItems="center">
              <ChainIcon chainId={mod.chainId} width={20} />
              {CHAINS[mod.chainId].name}
            </Flex>
          </LabeledData>
        </div>
        <RolesList roles={data.roles} mod={mod} />
      </main>
    </Layout>
  )
}
