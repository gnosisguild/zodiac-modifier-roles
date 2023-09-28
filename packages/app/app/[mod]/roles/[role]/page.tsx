import { Role, fetchRole, fetchRolesMod } from "zodiac-roles-sdk"

import styles from "./page.module.css"
import { notFound } from "next/navigation"
import { parseModParam, parseRoleParam } from "@/app/params"
import Flex from "@/ui/Flex"
import Box from "@/ui/Box"
import MembersList from "@/components/MembersList"
import PermissionsList from "@/components/permissions/PermissionsList"
import Layout, { Breadcrumb } from "@/components/Layout"
import Address from "@/ui/Address"

export default async function RolePage({
  params,
}: {
  params: { mod: string; role: string }
}) {
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  let data = await fetchRole({ ...mod, roleKey }, { next: { revalidate: 1 } })
  if (!data) {
    // If the role doesn't exist, we check if the mod exists.
    // In that case we show an empty role page so the user can start populating it.
    // Otherwise we show a 404.
    const modExists = await fetchRolesMod(mod, { next: { revalidate: 1 } })
    if (!modExists) {
      notFound()
    }

    data = newRole(roleKey)
  }

  return (
    <Layout
      head={
        <>
          <Breadcrumb href={`/${decodeURIComponent(params.mod)}`}>
            <Address address={mod.address} />
          </Breadcrumb>
          <Breadcrumb
            href={`/${decodeURIComponent(params.mod)}/roles/${params.role}`}
          >
            <Flex direction="column" gap={0}>
              {params.role}
              <Flex gap={0} alignItems="center" className={styles.roleKey}>
                <small>{roleKey}</small>
              </Flex>
            </Flex>
          </Breadcrumb>
        </>
      }
    >
      <main className={styles.main}>
        <Flex gap={1} className={styles.container}>
          <Box p={3} className={styles.members}>
            <h5>Members</h5>
            <MembersList members={data.members} chainId={mod.chainId} />
          </Box>
          <Box p={3} className={styles.permissions}>
            <h5>Permissions</h5>
            <PermissionsList
              targets={data.targets}
              annotations={data.annotations}
              chainId={mod.chainId}
            />
          </Box>
        </Flex>
      </main>
    </Layout>
  )
}

const newRole = (roleKey: `0x${string}`): Role => ({
  key: roleKey,
  members: [],
  targets: [],
  annotations: [],
  allowances: [],
})
