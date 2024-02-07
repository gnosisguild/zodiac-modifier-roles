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
import { CHAINS } from "../chains"

export default async function ModPage({ params }: { params: { mod: string } }) {
  const mod = parseModParam(params.mod)
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
          <label>Roles Instance</label>
          <h1>
            <Address
              address={mod.address}
              explorerLink
              copyToClipboard
              displayFull
              blockieClassName={classes.modBlockie}
              addressClassName={classes.modAddress}
            />
          </h1>
          <Flex gap={1} direction="column">
            <label>Chain</label>
            <Flex gap={2} alignItems="center">
              <ChainIcon chainId={mod.chainId} width={20} />
              {CHAINS[mod.chainId].name}
            </Flex>
          </Flex>
        </div>
        <RolesList roles={data.roles} mod={mod} />
      </main>
    </Layout>
  )
}
