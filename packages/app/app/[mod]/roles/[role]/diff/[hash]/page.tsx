import { fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"

import Layout from "@/components/Layout"
import { parseModParam, parseRoleParam } from "@/app/params"
import PageBreadcrumbs from "./breadcrumbs"
import Flex from "@/ui/Flex"
import Box from "@/ui/Box"
import ApplyUpdates from "@/components/ApplyUpdate"
import { fetchOrInitRole } from "../../fetching"
import { zPermissionsPost } from "@/app/api/permissions/types"
import DiffView from "@/components/DiffView"
import {
  checkUnwrappers,
  getOverallStatus,
  buildSetUnwrapperCalls,
} from "../../../../multisend/checkUnwrappers"
import styles from "./page.module.css"

export default async function DiffPage(props: {
  params: Promise<{ mod: string; role: string; hash: string }>
  searchParams: Promise<{ annotations?: string }>
}) {
  const searchParams = await props.searchParams
  const params = await props.params
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  const roleData = await fetchOrInitRole({ ...mod, roleKey })

  const value = await kv.get(params.hash)
  if (!value) {
    notFound()
  }
  const post = zPermissionsPost.parse(value)

  const showAnnotations = searchParams.annotations !== "false"

  const modInfo = await fetchRolesMod(mod)
  if (!modInfo) {
    notFound()
  }

  // Check if legacy multisend unwrappers need updating
  const unwrapperEntries = await checkUnwrappers(
    mod.chainId,
    mod.address,
    modInfo.multiSendAddresses
  )
  const hasLegacy = getOverallStatus(unwrapperEntries) === "legacy"
  const unwrapperFixCalls = hasLegacy
    ? buildSetUnwrapperCalls(mod.address, unwrapperEntries)
    : []
  const unwrapperFixComments = unwrapperFixCalls.map(
    () => "📦 Update MultiSend unwrapper to latest version"
  )

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
      <main>
        <Flex direction="column" gap={3}>
          {hasLegacy && (
            <Box p={2} className={styles.unwrapperWarning}>
              <Flex gap={2} alignItems="center">
                <span className={styles.warningIcon}>&#x26A0;</span>
                <span>
                  This Roles instance uses an outdated MultiSend unwrapper.
                  Calls to update the unwrapper have been appended below.
                </span>
              </Flex>
            </Box>
          )}
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
            appendCalls={unwrapperFixCalls}
            appendComments={unwrapperFixComments}
          />
        </Flex>
      </main>
    </Layout>
  )
}
