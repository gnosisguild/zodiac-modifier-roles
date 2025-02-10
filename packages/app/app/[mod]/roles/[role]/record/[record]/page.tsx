import { notFound } from "next/navigation"
import { parseModParam, parseRoleParam } from "@/app/params"
import { getRecordById } from "@/app/api/records/query"
import LabeledData from "@/ui/LabeledData"
import CopyButton from "@/ui/CopyButton"
import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import classes from "./page.module.css"

export default async function RecordPage({
  params,
}: {
  params: { mod: string; role: string; record: string }
}) {
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  // Fetch the record
  const record = await getRecordById(params.record)

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
      <main className={classes.main}>
        <div className={classes.header}>
          <LabeledData label="Recorded calls">
            <div className={classes.headerHash}>
              {params.record}
              <CopyButton value={params.record} />
            </div>
          </LabeledData>
        </div>
      </main>
    </Layout>
  )
}
