import {
  Annotation,
  Target,
  applyAnnotations,
  applyTargets,
  fetchRole,
} from "zodiac-roles-sdk"

import { notFound } from "next/navigation"
import Box from "@/ui/Box"
import Layout from "@/components/Layout"
import { kv } from "@vercel/kv"
import { parseModParam, parseRoleParam } from "@/app/params"
import PermissionsDiff from "@/components/permissions/PermissionsDiff"
import PageBreadcrumbs from "./breadcrumbs"
import styles from "./page.module.css"
import Flex from "@/ui/Flex"
import CallData from "@/components/CallData"

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

  const comments: string[] = []
  const logCall = (log: string) => comments.push(log)

  const calls = [
    ...(await applyTargets(roleKey, entry.targets, {
      ...mod,
      mode: "replace",
      currentTargets: roleData.targets,
      log: logCall,
    })),
    ...(await applyAnnotations(roleKey, entry.annotations, {
      ...mod,
      mode: "replace",
      currentAnnotations: roleData.annotations,
      log: logCall,
    })),
  ]

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
      <main className={styles.main}>
        <Flex direction="column" gap={1}>
          <PermissionsDiff
            left={roleData}
            right={entry}
            chainId={mod.chainId}
          />
          <Box p={3} className={styles.calls}>
            <h5>Calls to apply the diff</h5>
            <Flex direction="column" gap={3}>
              {calls.map((call, i) => (
                <Flex gap={3} key={i}>
                  <div className={styles.index}>{i}</div>
                  <CallData className={styles.calldata}>{call}</CallData>
                  <div className={styles.comment}>{comments[i]}</div>
                </Flex>
              ))}
            </Flex>
          </Box>
        </Flex>
      </main>
    </Layout>
  )
}
