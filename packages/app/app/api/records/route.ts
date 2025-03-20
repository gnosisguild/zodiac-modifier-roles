import { NextResponse } from "next/server"
import { z } from "zod"
import { nanoid } from "nanoid"
import crypto from "crypto"
import { Record, zCallInput } from "./types"
import { kv } from "@vercel/kv"
import { withErrorHandling } from "../utils/withErrorHandling"
import { indexCallInputs } from "./utils"

export const POST = withErrorHandling(async (req: Request) => {
  const validated = z.array(zCallInput).parse(await req.json())
  const calls = indexCallInputs(validated)

  // Generate URL-safe ID and auth token
  const id = nanoid()
  const authToken = crypto.randomBytes(32).toString("base64url")

  const now = new Date()

  // Create storage object
  const record: Record = {
    id,
    authToken,
    createdAt: now.toISOString(),
    lastUpdatedAt: now.toISOString(),
    calls,
    wildcards: {},
  }

  // Store in KV
  await kv.set(id, record)

  return NextResponse.json(record)
})
