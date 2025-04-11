import { Annotation, Target } from "zodiac-roles-sdk"

import classes from "./page.module.css"
import { notFound } from "next/navigation"
import PermissionsList from "@/components/permissions/PermissionsList"
import Layout from "@/components/Layout"
import { kv } from "@vercel/kv"
import { CHAINS } from "@/app/chains"
import LabeledData from "@/ui/LabeledData"
import CopyButton from "@/ui/CopyButton"
import PageBreadcrumbs from "./breadcrumbs"
import AnnotationsToggle from "@/components/AnnotationsToggle"

const chains = Object.values(CHAINS)

export default async function PermissionPage(props: {
  params: Promise<{ hash: string; chain: string }>
  searchParams: Promise<{ annotations?: string }>
}) {
  const searchParams = await props.searchParams
  const params = await props.params

  const { hash, chain } = params

  const chainId = chains.find((c) => c.prefix === chain.toLowerCase())?.id
  if (!chainId) {
    notFound()
  }

  const entry = await kv.get<{
    targets: Target[]
    annotations?: Annotation[]
  }>(hash)
  if (!entry) {
    notFound()
  }

  const { targets, annotations = [] } = entry

  const hasAnnotations = annotations.length > 0
  const showAnnotations = searchParams.annotations !== "false"

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

        <div className={classes.permissionsWrapper}>
          {hasAnnotations && (
            <div className={classes.toolbar}>
              <AnnotationsToggle on={showAnnotations} />
            </div>
          )}
          <PermissionsList
            targets={targets}
            annotations={showAnnotations ? annotations : []}
            chainId={chainId}
          />
        </div>
      </main>
    </Layout>
  )
}
