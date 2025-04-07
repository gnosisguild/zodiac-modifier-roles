import { notFound } from "next/navigation"
import { parseModParam, parseRoleParam } from "@/app/params"
import { getRecordById } from "@/app/api/records/query"
import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import classes from "./page.module.css"
import Flex from "@/ui/Flex"
import TargetCalls from "./TargetCalls"
import { groupBy } from "@/utils/groupBy"
import { isAuthorized } from "./auth"
import Apply from "./Apply"

export default async function RecordPage(props: {
  params: Promise<{ mod: string; role: string; record: string }>
}) {
  const params = await props.params
  const mod = parseModParam(params.mod)
  const roleKey = parseRoleParam(params.role)
  if (!mod || !roleKey) {
    notFound()
  }

  // Fetch the record
  const record = await getRecordById(params.record)

  const callsByTo = groupBy(Object.values(record.calls), (call) => call.to)
  const sortedEntries = Object.entries(callsByTo).sort((a, b) =>
    a[0] < b[0] ? -1 : 1
  )

  const authorized = await isAuthorized(record.authToken)

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
      <main className={classes.main}>
        <Flex direction="column" gap={3}>
          {sortedEntries.map(([to, calls], index) => (
            <TargetCalls
              key={index}
              to={to as `0x${string}`}
              calls={calls}
              wildcards={record.wildcards}
              chainId={mod.chainId}
              recordId={record.id}
              isAuthorized={authorized}
            />
          ))}

          <Apply />
        </Flex>
      </main>
    </Layout>
  )
}
