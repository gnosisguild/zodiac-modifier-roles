import {
  fetchRolesMod,
  planApplyRole,
  LicenseError,
} from "zodiac-roles-sdk"
import { notFound } from "next/navigation"
import { kv } from "@vercel/kv"

import Layout from "@/components/Layout"
import { parseModParam, parseRoleParam } from "@/app/params"
import PageBreadcrumbs from "./breadcrumbs"
import Flex from "@/ui/Flex"
import Box from "@/ui/Box"
import Alert from "@/ui/Alert"
import { LinkButton } from "@/ui/Button"
import { isGovernor } from "@/components/ApplyUpdate/ApplyViaGovernor/isGovernor"
import { isRethinkFactory } from "@/components/ApplyUpdate/ApplyViaRethinkFactory/isRethinkFactory"
import ApplyUpdateInteractive from "@/components/ApplyUpdate/ApplyUpdateInteractive"
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

  const unwrapperWarning = hasLegacy && (
    <Box p={2} className={styles.unwrapperWarning}>
      <Flex gap={2} alignItems="center">
        <span className={styles.warningIcon}>&#x26A0;</span>
        <span>
          This Roles instance uses an outdated MultiSend unwrapper. You can{" "}
          <a href={`/${params.mod}/multisend`}>update the unwrapper here</a>.
        </span>
      </Flex>
    </Box>
  )

  // Plan the role apply and handle license errors
  const comments: string[] = []
  const logCall = (log: string) => comments.push(log)

  let calls: { to: `0x${string}`; data: `0x${string}` }[] = []
  try {
    calls = await planApplyRole(
      {
        key: roleData.key,
        members: post.members,
        targets: post.targets,
        annotations: post.annotations,
      },
      { chainId: mod.chainId, address: mod.address, log: logCall }
    )
  } catch (error) {
    if (error instanceof LicenseError) {
      return (
        <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
          <main>
            <Flex direction="column" gap={3}>
              {error.status === "BLOCKED" ? (
                <Alert title="Subscription expired">
                  Updates to this role are currently blocked due to an expired
                  Zodiac subscription. To resume applying changes, renew your
                  subscription or contact us at ops@gnosisguild.org
                </Alert>
              ) : (
                <>
                  <Alert title="Zodiac OS account required">
                    This role is using allowances, a feature requiring a Zodiac
                    OS account. Please add the owner of the Roles Modifier to
                    your Zodiac OS organization using the button below.
                    Afterwards, reload this page to continue.
                  </Alert>
                  <LinkButton
                    primary
                    target="_blank"
                    href={`https://app.zodiac.eco/create/${error.owner}`}
                  >
                    Add account to Zodiac OS
                  </LinkButton>
                </>
              )}
              {unwrapperWarning}
            </Flex>
          </main>
        </Layout>
      )
    }
    throw error
  }

  let applyType: "safe" | "governor" | "rethink" = "safe"
  if (await isGovernor(mod.chainId, modInfo.owner)) applyType = "governor"
  else if (await isRethinkFactory(mod.chainId, modInfo.owner))
    applyType = "rethink"

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
                  Calls to update the unwrapper have been appended below. You
                  can also{" "}
                  <a href={`/${params.mod}/multisend`}>
                    update the unwrapper separately
                  </a>
                  .
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
          <ApplyUpdateInteractive
            appendCalls={unwrapperFixCalls}
            appendComments={unwrapperFixComments}
            initialCalls={calls}
            comments={comments}
            address={mod.address}
            owner={modInfo.owner}
            roleKey={roleData.key}
            chainId={mod.chainId}
            applyType={applyType}
          />
        </Flex>
      </main>
    </Layout>
  )
}
