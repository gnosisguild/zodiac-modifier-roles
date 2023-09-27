import { Annotation, Target } from "zodiac-roles-sdk"

import styles from "./page.module.css"
import { notFound } from "next/navigation"
import Box from "@/ui/Box"
import PermissionsList from "@/components/PermissionsList"
import Layout, { Breadcrumb } from "@/components/Layout"
import { kv } from "@vercel/kv"
import { CHAINS, ChainId } from "@/app/chains"

export default async function RolePage({
  params: { hash, chain },
}: {
  params: { hash: string; chain: string }
}) {
  const chainId = CHAINS[Number(chain) as ChainId]?.id as ChainId | undefined
  if (!chainId) {
    notFound()
  }

  const json = await kv.get<string>(hash)
  if (!json) {
    notFound()
  }

  const { targets, annotations } = JSON.parse(json) as {
    targets: Target[]
    annotations: Annotation[]
  }

  return (
    <Layout
      head={
        <>
          <Breadcrumb href={`/${hash}`}>
            Permissions: <code>${hash}</code>
          </Breadcrumb>
        </>
      }
    >
      <main className={styles.main}>
        <Box p={3} className={styles.permissions}>
          <h5>Permissions</h5>
          <PermissionsList
            targets={targets}
            annotations={annotations}
            chainId={chainId}
          />
        </Box>
      </main>
    </Layout>
  )
}
