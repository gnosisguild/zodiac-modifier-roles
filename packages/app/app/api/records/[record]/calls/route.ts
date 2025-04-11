import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { z } from "zod"
import { zCallInput, zRecord } from "../../types"
import { authorizeRequest } from "../../auth"
import { withErrorHandling } from "../../../utils/withErrorHandling"
import { indexCallInputs } from "../../utils"

export const POST = withErrorHandling(
  async (
    req: Request,
    { params }: { params: Promise<{ record: string }> }
  ): Promise<Response> => {
    const { record: recordId } = await params

    // Get record from KV store
    const value = await kv.json.get(recordId)
    if (!value) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    const record = zRecord.parse(value)

    // Check authorization
    authorizeRequest(req, record.authToken)

    // Add new calls to record, skipping duplicates
    const callInputs = z.array(zCallInput).parse(await req.json())
    const callsToAdd = indexCallInputs(callInputs, Object.keys(record.calls))

    const promises = Object.entries(callsToAdd).map(([id, call]) =>
      kv.json.set(recordId, `$.calls.${id}`, call)
    )

    // Update last updated date
    const lastUpdatedAt = new Date().toISOString()
    promises.push(
      kv.json.set(recordId, "$.lastUpdatedAt", JSON.stringify(lastUpdatedAt))
    )

    await Promise.all(promises)

    return NextResponse.json({
      success: true,
      lastUpdatedAt,
    })
  }
)
