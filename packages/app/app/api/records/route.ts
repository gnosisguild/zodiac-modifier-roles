import { NextResponse } from "next/server"
import { z } from "zod"
import { nanoid } from "nanoid"
import crypto from "crypto"
import { Call, zCall } from "./types"
import { kv } from "@vercel/kv"

export async function POST(req: Request) {
  const json = await req.json()

  let validated: Call[]
  try {
    // Validate array of zCall objects
    validated = z.array(zCall).parse(json)
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid call array format",
      },
      { status: 400 }
    )
  }

  // Generate URL-safe ID and auth token
  const id = nanoid()
  const authToken = crypto.randomBytes(32).toString("base64url")

  // Create storage object
  const storageObject = {
    calls: validated,
    authToken,
    createdAt: new Date().toISOString(),
  }

  // Store in KV
  await kv.set(id, JSON.stringify(storageObject))

  return NextResponse.json({
    id,
    authToken,
  })
}
