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

  const callsByTo = groupBy(Object.values(record.calls), (call) => call.to)

  return (
    <Layout head={<PageBreadcrumbs {...params} mod={mod} />}>
      <main className={classes.main}>
        <Flex direction="column" gap={3}>
          {Object.entries(callsByTo).map(([to, calls], index) => (
            <TargetCalls
              key={index}
              to={to as `0x${string}`}
              calls={calls}
              wildcards={record.wildcards}
              chainId={mod.chainId}
              recordId={record.id}
              isAuthorized={isAuthorized(record.authToken)}
            />
          ))}

          <Apply />
        </Flex>
      </main>
    </Layout>
  )
}
