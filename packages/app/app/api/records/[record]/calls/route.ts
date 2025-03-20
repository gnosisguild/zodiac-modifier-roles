import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { zCallInput, zRecord } from "../../types"
import { authorizeRequest } from "../../auth"
import { withErrorHandling } from "../../../utils/withErrorHandling"

// Your POST handler wrapped with error handling
export const POST = withErrorHandling(
  async (
    req: Request,
    { params }: { params: { record: string } }
  ): Promise<Response> => {
    // Get record from KV store
    const value = await kv.get(params.record)
    if (!value) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    const record = zRecord.parse(value)

    // Check authorization
    authorizeRequest(req, record.authToken)

    // Append new calls to record, filtering out duplicate calls
    const newCalls = z.array(zCallInput).parse(await req.json())
    const callsWithIds = newCalls.map((call) => ({
      ...call,
      id: callId(call),
    }))
    const filteredCalls = callsWithIds.filter(
      (call) => !record.calls.some((existing) => existing.id === call.id)
    )
    record.calls = [...record.calls, ...filteredCalls]

    // Update in KV store
    record.lastUpdatedAt = new Date().toISOString()
    await kv.set(params.record, record)

    return NextResponse.json({
      success: true,
      lastUpdatedAt: record.lastUpdatedAt,
    })
  }
)

type CallInput = z.infer<typeof zCallInput>
const callId = (call: CallInput) => {
  const str =
    call.operation + BigInt(call.value).toString() + call.to + call.data
  return crypto.createHash("md5").update(str).digest("base64url")
}
