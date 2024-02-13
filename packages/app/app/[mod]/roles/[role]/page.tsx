import classes from "./page.module.css"
import { notFound } from "next/navigation"
import { parseModParam, parseRoleParam } from "@/app/params"
import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import RoleView from "@/components/RoleView"
import cn from "classnames"

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

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
      <main className={classes.main}>
        <div className={classes.header}>
          {params.role == roleKey && <label>Role key</label>}
          <h1 className={cn(params.role == roleKey && classes.rawRoleKey)}>
            {params.role}
          </h1>
          {params.role !== roleKey && (
            <div className={classes.roleKey}>
              <label>Role key</label>
              <p>{roleKey}</p>
            </div>
          )}
        </div>
        <RoleView mod={mod} roleKey={roleKey} />
      </main>
    </Layout>
  )
}
