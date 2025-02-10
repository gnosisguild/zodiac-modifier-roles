import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { authorizeRequest } from "../auth"

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
  // Get record from KV store
  const storedData = await kv.get(params.record)
  if (!storedData) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 })
  }

  const record = JSON.parse(storedData as string)

  // Use common authorization logic
  const authError = authorizeRequest(req, record.authToken)
  if (authError) return authError

  // Continue with your endpoint logic...
  // ...
  return NextResponse.json({ success: true })
}
