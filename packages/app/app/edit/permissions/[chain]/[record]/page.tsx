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
import { kv } from "@vercel/kv"

import { zRecord } from "@/app/api/records/types"

const chains = Object.values(CHAINS)

export default async function EditPermissionsPage({
  params,
}: {
  params: { chain: string; record: string }
}) {
  const chainId = chains.find(
    (c) => c.prefix === params.chain.toLowerCase()
  )?.id
  if (!chainId) {
    notFound()
  }

  const value = await kv.get(params.record)
  if (!value) {
    notFound()
  }
  const record = zRecord.parse(value)

  return (
    <Layout head={<PageBreadcrumbs {...params} />}>
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
