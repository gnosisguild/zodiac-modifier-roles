import { kv } from "@vercel/kv"
import { notFound } from "next/navigation"
import { zRecord } from "./types"
import { experimental_taintUniqueValue } from "react"

export async function getRecordById(recordId: string) {
  const storedRecord = await kv.json.get(recordId)

  if (!storedRecord) {
    notFound()
  }

  // Validate the fetched record.
  const record = zRecord.parse(storedRecord)

  // Prevent the authToken from ever being passed to the client
  experimental_taintUniqueValue(
    "Never pass the authToken to the client",
    record,
    record.authToken
  )

  return record
}
