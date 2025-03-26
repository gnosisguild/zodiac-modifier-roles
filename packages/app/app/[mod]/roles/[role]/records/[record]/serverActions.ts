"use server"

import { getRecordById } from "@/app/api/records/query"
import { Call, Operation } from "@/app/api/records/types"
import { kv } from "@vercel/kv"
import {
  checkIntegrity,
  FunctionPermission,
  Permission,
  processPermissions,
  Target,
} from "zodiac-roles-sdk"
import { isAuthorized } from "./auth"
import { createRecord } from "@/app/api/records/route"
import { createPermissionsPost } from "@/app/api/permissions/route"
import { Record } from "@/app/api/records/types"
import { fetchContractInfo } from "@/app/abi"
import { ChainId } from "@/app/chains"
import { AbiFunction, decodeFunctionData, toFunctionSelector } from "viem"

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

export async function serverCreateCopy({ recordId }: { recordId: string }) {
  const record = await getRecordById(recordId)
  const copy = await createRecord(record.calls, record.wildcards)
  return copy
}

export async function serverApplyPermissions({
  recordId,
  chainId,
}: {
  recordId: string
  chainId: ChainId
}) {
  const record = await getRecordById(recordId)
  const permissions = await derivePermissionsFromRecord(record, chainId)
  const { targets } = processPermissions(permissions)
  checkIntegrity(targets)
  const hash = await createPermissionsPost({ targets })
  return hash
}

async function derivePermissionsFromRecord(
  record: Record,
  chainId: ChainId
): Promise<FunctionPermission[]> {
  const calls = Object.values(record.calls)

  // fetch all ABIs (they should already be in cache at this point)
  const targets = new Set(calls.map((call) => call.to))
  const abiEntries = Object.fromEntries(
    await Promise.all(
      [...targets].map(
        async (target) =>
          [target, await fetchContractInfo(target, chainId)] as const
      )
    )
  )

  return calls.map((call) => {
    const selector = call.data.slice(0, 10) as `0x${string}`
    const functionAbi = abiEntries[call.to]?.abi?.find(
      (fragment: any) =>
        fragment.type === "function" &&
        toFunctionSelector(fragment) === selector
    ) as AbiFunction | undefined

    if (!functionAbi) {
      throw new Error(`Unable to decode function data for call ${call.id}`)
    }

    const wildcards = record.wildcards[call.to + ":" + selector] || {}
    return derivePermissionFromCall({ call, abi: functionAbi, wildcards })
  })

  return []
}

const derivePermissionFromCall = ({
  call,
  abi,
  wildcards,
}: {
  call: Call
  abi: AbiFunction
  wildcards: { [paramPath: string]: boolean | undefined }
}): FunctionPermission => {
  const selector = call.data.slice(0, 10) as `0x${string}`
  const { args } = decodeFunctionData({ abi: [abi], data: call.data })

  const noWildcards = Object.values(wildcards).every((v) => !v)
  const allWildcarded = abi.inputs

  return {
    targetAddress: call.to,
    selector,
    delegatecall: call.operation === Operation.DelegateCall,
    send: BigInt(call.value || "0") > 0,
    condition: null,
  }
}
