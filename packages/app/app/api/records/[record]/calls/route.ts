import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { z } from "zod"
import { zCall, zRecord } from "../../types"
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
    const newCalls = z.array(zCall).parse(await req.json())
    const filteredCalls = newCalls.filter(
      (call) => !record.calls.some((existing) => callsEqual(call, existing))
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

type Call = z.infer<typeof zCall>
const callsEqual = (a: Call, b: Call) =>
  a.to === b.to &&
  a.data === b.data &&
  a.value === b.value &&
  a.operation === b.operation
