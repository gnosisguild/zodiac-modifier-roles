import { Annotation, Clearance, Target } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"

import Layout from "@/components/Layout"
import PermissionsDiff from "@/components/permissions/PermissionsDiff"
import LabeledData from "@/ui/LabeledData"
import Flex from "@/ui/Flex"
import PageBreadcrumbs from "./breadcrumbs"
import styles from "./page.module.css"
import { CHAINS } from "@/app/chains"
import Link from "next/link"

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

  const hasAnnotations =
    left.annotations.length > 0 || right.annotations.length > 0
  const shallShowAnnotations = searchParams.annotations !== "false"

  return (
    <Layout head={<PageBreadcrumbs {...params} />}>
      {hasAnnotations && (
        <Flex
          direction="row"
          gap={1}
          justifyContent="end"
          className={styles.toolbar}
        >
          <Link href={{ query: { annotations: !shallShowAnnotations } }}>
            {shallShowAnnotations ? "Hide annotations" : "Show annotations"}
          </Link>
        </Flex>
      )}
      <main className={styles.main}>
        <PermissionsDiff
          left={{
            targets: left.targets.filter(
              (target) => !isEmptyFunctionScoped(target)
            ),
            annotations: shallShowAnnotations ? left.annotations : [],
          }}
          right={{
            targets: right.targets.filter(
              (target) => !isEmptyFunctionScoped(target)
            ),
            annotations: shallShowAnnotations ? right.annotations : [],
          }}
          chainId={chainId}
        />
      </main>
    </Layout>
  )
}

const isEmptyFunctionScoped = (target: Target) =>
  target.clearance === Clearance.Function && target.functions.length === 0
