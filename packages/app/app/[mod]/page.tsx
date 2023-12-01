import { fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"

import styles from "./page.module.css"
import { parseModParam } from "@/app/params"
import RolesList from "@/components/RolesList"
import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"

export default async function ModPage({ params }: { params: { mod: string } }) {
  const mod = parseModParam(params.mod)
  if (!mod) {
    notFound()
  }

  const data = await fetchRolesMod(mod, { next: { revalidate: 1 } })
  if (!data) {
    notFound()
  }

  return (
    <Layout head={<PageBreadcrumbs mod={params.mod} />}>
      <main className={styles.main}>
        <RolesList roles={data.roles} mod={params.mod} />
      </main>
    </Layout>
  )
}
