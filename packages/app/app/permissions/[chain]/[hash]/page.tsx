import { Annotation, Target } from "zodiac-roles-sdk"
import { MdOutlinePolicy } from "react-icons/md"

import styles from "./page.module.css"
import { notFound } from "next/navigation"
import Box from "@/ui/Box"
import PermissionsList from "@/components/PermissionsList"
import Layout, { Breadcrumb } from "@/components/Layout"
import { kv } from "@vercel/kv"
import { CHAINS, ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"

export default async function RolePage({
  params: { hash, chain },
}: {
  params: { hash: string; chain: string }
}) {
  const chainId = CHAINS[Number(chain) as ChainId]?.id as ChainId | undefined
  if (!chainId) {
    notFound()
  }

  const entry = await kv.get<{
    targets: Target[]
    annotations: Annotation[]
  }>(hash)
  if (!entry) {
    notFound()
  }

  const { targets, annotations } = entry

  return (
    <Layout
      head={
        <>
          <Breadcrumb href={`/permissions/${chainId}/${hash}`}>
            <Flex gap={2} alignItems="center">
              <MdOutlinePolicy />
              <code className={styles.hash}>{hash}</code>
            </Flex>
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
