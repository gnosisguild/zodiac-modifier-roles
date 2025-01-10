import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"

import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import { CHAINS } from "@/app/chains"
import { PermissionsPost } from "@/app/api/permissions/types"
import DiffView from "@/components/DiffView"

const chains = Object.values(CHAINS)

export default async function DiffPage({
  params,
  searchParams,
}: {
  params: { chain: string; hash: string; hashRight: string }
  searchParams: { annotations?: string }
}) {
  const chainId = chains.find(
    (c) => c.prefix === params.chain.toLowerCase()
  )?.id

  if (!chainId) {
    notFound()
  }

  const left = await kv.get<PermissionsPost>(params.hash)
  if (!left) {
    notFound()
  }

  const right = await kv.get<PermissionsPost>(params.hashRight)
  if (!right) {
    notFound()
  }

  const showAnnotations = searchParams.annotations !== "false"

  return (
    <Layout head={<PageBreadcrumbs {...params} />}>
      <main>
        <DiffView
          left={left}
          right={right}
          chainId={chainId}
          showAnnotations={showAnnotations}
        />
      </main>
    </Layout>
  )
}
