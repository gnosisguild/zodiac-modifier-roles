import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { z } from "zod"
import { zAlternatives, zRecord, zWildcards } from "../../types"
import { authorizeRequest } from "../../auth"
import { withErrorHandling } from "@/app/api/utils/withErrorHandling"

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: { record: string } }) => {
    // Get record from KV store
    const value = await kv.get(params.record)
    if (!value) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    const record = zRecord.parse(value)

    // Check authorization
    authorizeRequest(req, record.authToken)

    // Validate new wildcards
    const { wildcards, alternatives } = z
      .object({
        wildcards: zWildcards,
        alternatives: zAlternatives,
      })
      .parse(await req.json())

    // Update wildcards & alternatives
    record.wildcards = wildcards
    record.alternatives = alternatives

    // Update KV store
    record.lastUpdatedAt = new Date()
    await kv.set(params.record, record)

    return NextResponse.json({
      success: true,
      lastUpdatedAt: record.lastUpdatedAt,
    })
  }
)
