import { notFound } from "next/navigation"
import cn from "classnames"
import { parseModParam, parseRoleParam } from "@/app/params"
import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import RoleView from "@/components/RoleView"
import classes from "./page.module.css"
import { fetchOrInitRole } from "./fetching"

export default async function RolePage(
  props: {
    params: Promise<{ mod: string; role: string; hash?: string }>
    searchParams: Promise<{ annotations?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  const role = await fetchOrInitRole({ ...mod, roleKey })
  const showAnnotations = searchParams.annotations !== "false"

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
        <RoleView mod={mod} role={role} showAnnotations={showAnnotations} />
      </main>
    </Layout>
  )
}
