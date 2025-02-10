import { kv } from "@vercel/kv"
import { notFound } from "next/navigation"
import { zRecord } from "./types"

export async function getRecordById(recordId: string) {
  const storedRecord = await kv.get(recordId)

  if (!storedRecord) {
    notFound()
  }

  // Validate the fetched record.
  const record = zRecord.parse(storedRecord)

  // Omit the authToken property so that the token isn’t exposed.
  const { authToken, ...publicRecord } = record

  return publicRecord
}
