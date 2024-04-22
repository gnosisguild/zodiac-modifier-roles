import { Annotation, Clearance, Target, fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"

import Layout from "@/components/Layout"
import { parseModParam, parseRoleParam } from "@/app/params"
import PermissionsDiff from "@/components/permissions/PermissionsDiff"
import PageBreadcrumbs from "./breadcrumbs"
import styles from "./page.module.css"
import Flex from "@/ui/Flex"
import { fetchOrInitRole } from "@/components/RoleView/fetching"
import Link from "next/link"
import ApplyUpdates from "@/components/ApplyUpdate"

export default async function DiffPage({
  params,
  searchParams,
}: {
  params: { mod: string; role: string; hash: string }
  searchParams: { annotations?: string }
}) {
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  const roleData = await fetchOrInitRole({ ...mod, roleKey })
  const roleTargets = roleData.targets.filter(
    (target) => !isEmptyFunctionScoped(target)
  )

  const entry = await kv.get<{
    targets: Target[]
    annotations: Annotation[]
  }>(params.hash)
  if (!entry) {
    notFound()
  }
  const entryTargets = entry.targets.filter(
    (target) => !isEmptyFunctionScoped(target)
  )

  const hasAnnotations =
    roleData.annotations.length > 0 || entry.annotations.length > 0
  const shallShowAnnotations = searchParams.annotations !== "false"

  const roleAnnotations = shallShowAnnotations ? roleData.annotations : []
  const entryAnnotations = shallShowAnnotations ? entry.annotations : []

  const modInfo = await fetchRolesMod(mod, { next: { revalidate: 1 } })
  if (!modInfo) {
    notFound()
  }

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
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
        <Flex direction="column" gap={1}>
          <PermissionsDiff
            left={{ targets: roleTargets, annotations: roleAnnotations }}
            right={{ targets: entryTargets, annotations: entryAnnotations }}
            chainId={mod.chainId}
          />
          <ApplyUpdates
            {...mod}
            role={params.role}
            owner={modInfo.owner}
            targets={entryTargets}
            annotations={entryAnnotations}
            currentTargets={roleTargets}
            currentAnnotations={roleAnnotations}
          />
        </Flex>
      </main>
    </Layout>
  )
}

const isEmptyFunctionScoped = (target: Target) =>
  target.clearance === Clearance.Function && target.functions.length === 0
