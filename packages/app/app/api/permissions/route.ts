import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { createHash } from "crypto"
import { z } from "zod"
import { zAnnotation, zTarget } from "@/components/PermissionsList/schema"

export async function POST(req: Request) {
  const json = await req.json()

  const zParams = z.object({
    target: z.array(zTarget),
    annotations: z.array(zAnnotation),
  })

  let validated: z.infer<typeof zParams>
  try {
    validated = zParams.parse(json)
  } catch (e) {
    return NextResponse.json({
      error:
        "Json input is neither a valid permissions array nor a valid targets array",
    })
  }

  const stringValue = JSON.stringify(validated)
  const key = await kv.set(hash(stringValue), stringValue)

  return NextResponse.json({ hash: key })
}

/** URL-safe hash function */
export default function hash(value: string) {
  const b64 = createHash("sha256").update(value).digest("base64")
  // Make URL safe
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
