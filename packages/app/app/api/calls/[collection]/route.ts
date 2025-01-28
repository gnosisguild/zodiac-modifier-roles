import { kv } from "@vercel/kv"
import { NextResponse } from "next/server"
import { z } from "zod"
import { timingSafeEqual } from "crypto"
import { Call, zCall } from "../types"

export async function GET(
  req: Request,
  { params }: { params: { collection: string } }
) {
  const storedData = await kv.get(params.collection)
  if (!storedData) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 })
  }

  const collection = JSON.parse(storedData as string)

  // Return calls array but omit sensitive authToken
  return NextResponse.json({
    id: params.collection,
    calls: collection.calls,
  })
}

export async function POST(
  req: Request,
  { params }: { params: { collection: string } }
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

  // Get collection from KV store
  const storedData = await kv.get(params.collection)
  if (!storedData) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 })
  }

  // Parse stored data
  const collection = JSON.parse(storedData as string)

  // Verify auth token using constant-time comparison
  if (!timingSafeEqual(Buffer.from(token), Buffer.from(collection.authToken))) {
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

  // Append new calls to collection
  collection.calls = [...collection.calls, ...newCalls]

  // Update KV store
  await kv.set(params.collection, JSON.stringify(collection))

  return NextResponse.json({
    success: true,
    callCount: collection.calls.length,
  })
}
