import { Annotation, Target, fetchRole } from "zodiac-roles-sdk"

import { notFound } from "next/navigation"
import Box from "@/ui/Box"
import Layout from "@/components/Layout"
import { kv } from "@vercel/kv"
import { parseModParam, parseRoleParam } from "@/app/params"
import PermissionsDiff from "@/components/permissions/PermissionsDiff"
import PageBreadcrumbs from "./breadcrumbs"
import styles from "./page.module.css"

export default async function DiffPage({
  params,
}: {
  params: { mod: string; role: string; hash: string }
}) {
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  let roleData = await fetchRole(
    { ...mod, roleKey },
    { next: { revalidate: 1 } }
  )
  if (!roleData) {
    notFound()
  }

  const entry = await kv.get<{
    targets: Target[]
    annotations: Annotation[]
  }>(params.hash)
  if (!entry) {
    notFound()
  }

  return (
    <Layout head={<PageBreadcrumbs {...params} />}>
      <main className={styles.main}>
        <PermissionsDiff left={roleData} right={entry} chainId={mod.chainId} />
      </main>
    </Layout>
  )
}
