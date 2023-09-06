import { fetchRolesMod } from "zodiac-roles-sdk"
import { notFound } from "next/navigation"

import styles from "./page.module.css"
import { parseModParam } from "@/app/params"
import RolesList from "@/components/RolesList"
import Layout from "@/components/Layout"

export default async function ModPage({ params }: { params: { mod: string } }) {
  const mod = parseModParam(params.mod)
  if (!mod) {
    notFound()
  }

  const data = await fetchRolesMod(mod)
  if (!data) {
    notFound()
  }

  return (
    <Layout>
      <main className={styles.main}>
        <RolesList roles={data.roles} mod={params.mod} />
      </main>
    </Layout>
  )
}
