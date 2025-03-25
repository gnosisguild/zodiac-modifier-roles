"use server"

import { getRecordById } from "@/app/api/records/query"
import { Call } from "@/app/api/records/types"
import { kv } from "@vercel/kv"
import { isAuthorized } from "../../auth"

async function getAuthorizedRecord(recordId: string) {
  const record = await getRecordById(recordId)
  if (!isAuthorized(record.authToken)) {
    throw new Error("Unauthorized")
  }
  return record
}

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
  const record = await getAuthorizedRecord(recordId)

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
  await getAuthorizedRecord(recordId)

  const multi = kv.multi()
  multi.json.set(
    recordId,
    `$.calls.${callId}.metadata.label`,
    JSON.stringify(label)
  )
  multi.json.set(
    recordId,
    `$.lastUpdatedAt`,
    JSON.stringify(new Date().toISOString())
  )

  await multi.exec()
}

export async function serverDeleteCall({
  recordId,
  callId,
}: {
  recordId: string
  callId: string
}) {
  await getAuthorizedRecord(recordId)

  const multi = kv.multi()
  multi.json.del(recordId, `$.calls.${callId}`)
  multi.json.set(
    recordId,
    `$.lastUpdatedAt`,
    JSON.stringify(new Date().toISOString())
  )

  await multi.exec()
}

export async function serverAddCall({
  recordId,
  call,
}: {
  recordId: string
  call: Call
}) {
  await getAuthorizedRecord(recordId)

  const multi = kv.multi()
  multi.json.set(recordId, `$.calls.${call.id}`, call)
  multi.json.set(
    recordId,
    `$.lastUpdatedAt`,
    JSON.stringify(new Date().toISOString())
  )

  await multi.exec()
}
