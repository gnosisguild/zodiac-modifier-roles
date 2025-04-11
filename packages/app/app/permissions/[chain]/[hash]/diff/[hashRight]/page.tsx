import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"

import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import { CHAINS } from "@/app/chains"
import { PermissionsPost, zPermissionsPost } from "@/app/api/permissions/types"
import DiffView from "@/components/DiffView"

const chains = Object.values(CHAINS)

export default async function DiffPage(
  props: {
    params: Promise<{ chain: string; hash: string; hashRight: string }>
    searchParams: Promise<{ annotations?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const chainId = chains.find(
    (c) => c.prefix === params.chain.toLowerCase()
  )?.id

  if (!chainId) {
    notFound()
  }

  const leftValue = await kv.get(params.hash)
  const rightValue = await kv.get(params.hashRight)
  if (!leftValue || !rightValue) {
    notFound()
  }

  const left = zPermissionsPost.parse(leftValue)
  const right = zPermissionsPost.parse(rightValue)

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
