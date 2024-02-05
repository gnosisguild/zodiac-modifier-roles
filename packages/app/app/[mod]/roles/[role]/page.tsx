import { Role, fetchRole, fetchRolesMod } from "zodiac-roles-sdk"

import styles from "./page.module.css"
import { notFound } from "next/navigation"
import { parseModParam, parseRoleParam } from "@/app/params"
import Flex from "@/ui/Flex"
import Box from "@/ui/Box"
import MembersList from "@/components/MembersList"
import PermissionsList from "@/components/permissions/PermissionsList"
import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import { fetchOrInitRole } from "./fetching"

export default async function RolePage({
  params,
}: {
  params: { mod: string; role: string; hash?: string }
}) {
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  let data = await fetchOrInitRole({ ...mod, roleKey })

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
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
