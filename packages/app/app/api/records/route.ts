import { NextResponse } from "next/server"
import { z } from "zod"
import { nanoid } from "nanoid"
import crypto from "crypto"
import { Record, zCall } from "./types"
import { kv } from "@vercel/kv"
import { withErrorHandling } from "../utils/withErrorHandling"

export const POST = withErrorHandling(async (req: Request) => {
  const validated = z.array(zCall).parse(await req.json())

  // Generate URL-safe ID and auth token
  const id = nanoid()
  const authToken = crypto.randomBytes(32).toString("base64url")

  const now = new Date()

  // Create storage object
  const storageObject: Record = {
    authToken,
    createdAt: now,
    lastUpdatedAt: now,
    calls: validated,
    wildcards: {},
    alternatives: {},
  }

  // Store in KV
  await kv.set(id, storageObject)

  return NextResponse.json(storageObject)
})
