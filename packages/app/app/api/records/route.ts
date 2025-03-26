import { NextResponse } from "next/server"
import { z } from "zod"
import { nanoid } from "nanoid"
import crypto from "crypto"
import { Record, Wildcards, zCallInput } from "./types"
import { kv } from "@vercel/kv"
import { withErrorHandling } from "../utils/withErrorHandling"
import { indexCallInputs } from "./utils"

export const createRecord = async (
  calls: Record["calls"],
  wildcards: Wildcards
) => {
  // Generate URL-safe ID and auth token
  const id = nanoid()
  const authToken = crypto.randomBytes(32).toString("base64url")

  const now = new Date().toISOString()

  // Create storage object
  const record: Record = {
    id,
    authToken,
    createdAt: now,
    lastUpdatedAt: now,
    calls,
    wildcards,
  }

  // Store in KV
  await kv.json.set(id, "$", record)

  return record
}

export const POST = withErrorHandling(async (req: Request) => {
  const validated = z.array(zCallInput).parse(await req.json())
  const calls = indexCallInputs(validated)

  // Generate URL-safe ID and auth token

  // Create storage object
  const record = await createRecord(calls, {})
  return NextResponse.json(record)
})
