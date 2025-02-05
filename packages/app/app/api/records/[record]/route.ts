import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { z } from "zod"
import { timingSafeEqual } from "crypto"
import { Call, zCall } from "../types"

export async function GET(
  req: Request,
  { params }: { params: { record: string } }
) {
  const storedData = await kv.get(params.record)
  if (!storedData) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 })
  }

  const record = JSON.parse(storedData as string)

  // Return calls array but omit sensitive authToken
  return NextResponse.json({
    id: params.record,
    calls: record.calls,
  })
}

export async function POST(
  req: Request,
  { params }: { params: { record: string } }
) {
  // Get and validate authorization header format
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Authorization header must be Bearer token",
        format: "Bearer <token>",
      },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7) // Remove 'Bearer ' prefix
  if (!token) {
    return NextResponse.json(
      {
        error: "Token is required",
      },
      { status: 401 }
    )
  }

  // Get record from KV store
  const storedData = await kv.get(params.record)
  if (!storedData) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 })
  }

  // Parse stored data
  const record = JSON.parse(storedData as string)

  // Verify auth token using constant-time comparison
  if (
    !timingSafeEqual(
      new Uint8Array(Buffer.from(token)),
      new Uint8Array(Buffer.from(record.authToken))
    )
  ) {
    return NextResponse.json(
      { error: "Invalid authorization" },
      { status: 403 }
    )
  }

  // Validate new calls
  const json = await req.json()
  let newCalls: Call[]
  try {
    newCalls = z.array(zCall).parse(json)
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid call array format",
      },
      { status: 400 }
    )
  }

  // Append new calls to record
  record.calls = [...record.calls, ...newCalls]

  // Update KV store
  await kv.set(params.record, JSON.stringify(record))

  return NextResponse.json({
    success: true,
    callCount: record.calls.length,
  })
}
