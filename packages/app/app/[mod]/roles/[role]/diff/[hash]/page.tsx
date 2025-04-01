import { fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"

import Layout from "@/components/Layout"
import { parseModParam, parseRoleParam } from "@/app/params"
import PageBreadcrumbs from "./breadcrumbs"
import styles from "./page.module.css"
import Flex from "@/ui/Flex"
import ApplyUpdates from "@/components/ApplyUpdate"
import AnnotationsToggle from "@/components/AnnotationsToggle"
import { fetchOrInitRole } from "../../fetching"
import { PermissionsPost } from "@/app/api/permissions/types"
import DiffView from "@/components/DiffView"

export default async function DiffPage(
  props: {
    params: Promise<{ mod: string; role: string; hash: string }>
    searchParams: Promise<{ annotations?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  const roleData = await fetchOrInitRole({ ...mod, roleKey })

  const post = await kv.get<PermissionsPost>(params.hash)
  if (!post) {
    notFound()
  }

  const hasAnnotations =
    roleData.annotations.length > 0 ||
    (post.annotations && post.annotations.length > 0)

  const showAnnotations = searchParams.annotations !== "false"

  const modInfo = await fetchRolesMod(mod, { next: { revalidate: 1 } })
  if (!modInfo) {
    notFound()
  }

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
      <main>
        <Flex direction="column" gap={3}>
          <DiffView
            left={roleData}
            right={post}
            chainId={mod.chainId}
            showAnnotations={showAnnotations}
          />
          <ApplyUpdates
            {...mod}
            role={roleData}
            owner={modInfo.owner}
            targets={post.targets}
            annotations={post.annotations}
            members={post.members}
          />
        </Flex>
      </main>
    </Layout>
  )
}
