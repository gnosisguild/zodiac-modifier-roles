import { notFound } from "next/navigation"
import { parseModParam, parseRoleParam } from "@/app/params"
import { getRecordById } from "@/app/api/records/query"
import LabeledData from "@/ui/LabeledData"
import CopyButton from "@/ui/CopyButton"
import Layout from "@/components/Layout"
import PageBreadcrumbs from "./breadcrumbs"
import classes from "./page.module.css"
import Flex from "@/ui/Flex"
import Box from "@/ui/Box"
import { RelativeTime } from "@/components/RelativeTime"
import TargetCalls from "./TargetCalls"

const shortDateFormat = new Intl.RelativeTimeFormat(undefined, {
  style: "short",
})

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

  const callsByTarget = groupBy(record.calls, (call) => call.to)

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

          <Flex direction="column" gap={3}>
            {Object.entries(callsByTarget).map(([target, calls], index) => (
              <TargetCalls
                key={index}
                targetAddress={target as `0x${string}`}
                calls={calls}
                chainId={mod.chainId}
              />
            ))}
          </Flex>
        </div>
      </main>
    </Layout>
  )
}

export const groupBy = <T, K extends keyof any>(
  arr: readonly T[],
  key: (i: T) => K
) =>
  arr.reduce((groups, item) => {
    ;(groups[key(item)] ||= []).push(item)
    return groups
  }, {} as Record<K, T[]>)
