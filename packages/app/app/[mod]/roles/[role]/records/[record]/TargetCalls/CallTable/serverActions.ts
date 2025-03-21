"use server"

import { getRecordById } from "@/app/api/records/query"
import { Call } from "@/app/api/records/types"
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
  multi.json.set(
    recordId,
    `$.lastUpdatedAt`,
    JSON.stringify(new Date().toISOString())
  )

  await multi.exec()
}

export async function serverLabelCall({
  recordId,
  callId,
  label,
}: {
  recordId: string
  callId: string
  label: string
}) {
  console.log("label call server", recordId, callId, label)
  const record = await getRecordById(recordId)

  // TODO authentication!!!!
}

export async function serverDeleteCall({
  recordId,
  callId,
}: {
  recordId: string
  callId: string
}) {
  console.log("delete call server", recordId, callId)
  const record = await getRecordById(recordId)

  // TODO authentication!!!!
}

export async function serverAddCall({
  recordId,
  call,
}: {
  recordId: string
  call: Call
}) {
  console.log("add call server", recordId, call)
  const record = await getRecordById(recordId)

  // TODO authentication!!!!
}
