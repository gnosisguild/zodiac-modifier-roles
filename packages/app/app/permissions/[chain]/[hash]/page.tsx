import { Annotation, Target } from "zodiac-roles-sdk"
import { MdOutlinePolicy } from "react-icons/md"

import classes from "./page.module.css"
import { notFound } from "next/navigation"
import Box from "@/ui/Box"
import PermissionsList from "@/components/permissions/PermissionsList"
import Layout, { Breadcrumb } from "@/components/Layout"
import { kv } from "@vercel/kv"
import { CHAINS, ChainId } from "@/app/chains"
import Flex from "@/ui/Flex"
import LabeledData from "@/ui/LabeledData"
import CopyButton from "@/ui/CopyButton"

const chains = Object.values(CHAINS)

export default async function PermissionPage({
  params: { hash, chain },
}: {
  params: { hash: string; chain: string }
}) {
  const chainId = chains.find((c) => c.prefix === chain.toLowerCase())?.id
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
          <Breadcrumb>
            <Flex gap={2} alignItems="center">
              <LabeledData label="Permission Hash">
                <div className={classes.hash}>{hash}</div>
              </LabeledData>
            </Flex>
          </Breadcrumb>
        </>
      }
    >
      <main className={classes.main}>
        <div className={classes.header}>
          <LabeledData label="Permission Hash">
            <div className={classes.headerHash}>
              {hash}
              <CopyButton value={hash} />
            </div>
          </LabeledData>
        </div>
        <PermissionsList
          targets={targets}
          annotations={annotations}
          chainId={chainId}
        />
      </main>
    </Layout>
  )
}
