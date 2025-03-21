"use server"

import { getRecordById } from "@/app/api/records/query"
import { kv } from "@vercel/kv"

export async function serverToggleWildcard({
  recordId,
  targetSelector,
  paramPath,
  isWildcarded,
}: {
  recordId: string
  targetSelector: string
  paramPath: string
  isWildcarded: boolean
}) {
  "use server"
  console.log(
    "wildcard toggle server",
    recordId,
    targetSelector,
    paramPath,
    isWildcarded
  )
  const record = await getRecordById(recordId)

  // TODO authentication!!!!

  const multi = kv.multi()
  if (!isWildcarded) {
    multi.json.del(recordId, `$.wildcards.${targetSelector}.${paramPath}`)
  } else {
    if (!record.wildcards[targetSelector]) {
      multi.json.set(recordId, `$.wildcards.${targetSelector}`, {})
    }
    multi.json.set(recordId, `$.wildcards.${targetSelector}.${paramPath}`, true)
  }
  multi.json.set(recordId, `$.lastUpdatedAt`, new Date().toISOString())

  await multi.exec()
}
