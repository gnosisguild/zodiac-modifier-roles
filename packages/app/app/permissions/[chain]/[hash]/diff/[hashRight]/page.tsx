import { Annotation, Clearance, Target } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"

import Layout from "@/components/Layout"
import PermissionsDiff from "@/components/permissions/PermissionsDiff"
import PageBreadcrumbs from "./breadcrumbs"
import styles from "./page.module.css"
import { CHAINS } from "@/app/chains"

const chains = Object.values(CHAINS)

export default async function DiffPage({
  params,
}: {
  params: { chain: string; hash: string; hashRight: string }
}) {
  const chainId = chains.find(
    (c) => c.prefix === params.chain.toLowerCase()
  )?.id
  if (!chainId) {
    notFound()
  }

  const left = await kv.get<{
    targets: Target[]
    annotations: Annotation[]
  }>(params.hash)
  if (!left) {
    notFound()
  }

  const right = await kv.get<{
    targets: Target[]
    annotations: Annotation[]
  }>(params.hashRight)
  if (!right) {
    notFound()
  }

  return (
    <Layout head={<PageBreadcrumbs {...params} />}>
      <main className={styles.main}>
        <PermissionsDiff
          left={{
            targets: left.targets.filter(
              (target) => !isEmptyFunctionScoped(target)
            ),
            annotations: left.annotations,
          }}
          right={{
            targets: right.targets.filter(
              (target) => !isEmptyFunctionScoped(target)
            ),
            annotations: right.annotations,
          }}
          chainId={chainId}
        />
      </main>
    </Layout>
  )
}

const isEmptyFunctionScoped = (target: Target) =>
  target.clearance === Clearance.Function && target.functions.length === 0
