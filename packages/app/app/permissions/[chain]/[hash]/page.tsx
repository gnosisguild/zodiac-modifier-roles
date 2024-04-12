import { Annotation, Target } from "zodiac-roles-sdk"

import classes from "./page.module.css"
import { notFound } from "next/navigation"
import PermissionsList from "@/components/permissions/PermissionsList"
import Layout, { Breadcrumb } from "@/components/Layout"
import { kv } from "@vercel/kv"
import { CHAINS, ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import LabeledData from "@/ui/LabeledData"
import CopyButton from "@/ui/CopyButton"
import PageBreadcrumbs from "./breadcrumbs"

const chains = Object.values(CHAINS)

export default async function PermissionPage({
  params: { hash, chain },
}: {
  params: { hash: string; chain: string }
}) {
  const chainId = chains.find((c) => c.prefix === chain.toLowerCase())?.id
  if (!chainId) {
    notFound()
  }

  const entry = await kv.get<{
    targets: Target[]
    annotations: Annotation[]
  }>(hash)
  if (!entry) {
    notFound()
  }

  const { targets, annotations } = entry

  return (
    <Layout head={<PageBreadcrumbs chain={chain} hash={hash} />}>
      <main className={classes.main}>
        <div className={classes.header}>
          <LabeledData label="Permissions Hash">
            <div className={classes.headerHash}>
              {hash}
              <CopyButton value={hash} />
            </div>
          </LabeledData>
        </div>
        <PermissionsList
          targets={targets}
          annotations={annotations}
          chainId={chainId}
        />
      </main>
    </Layout>
  )
}
