import { NextResponse } from "next/server"
import { z } from "zod"
import { zCallInput } from "./types"
import { withErrorHandling } from "../utils/withErrorHandling"
import { indexCallInputs } from "./utils"
import { createRecord } from "./createRecord"

export const POST = withErrorHandling(async (req: Request) => {
  const validated = z.array(zCallInput).parse(await req.json())
  const calls = indexCallInputs(validated)

  // Generate URL-safe ID and auth token

  // Create storage object
  const record = await createRecord(calls, {})
  return NextResponse.json(record)
})
