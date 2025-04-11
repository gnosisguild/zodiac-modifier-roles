import { kv } from "@vercel/kv"
import { nanoid } from "nanoid"
import crypto from "crypto"
import { Wildcards, Record } from "./types"

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
