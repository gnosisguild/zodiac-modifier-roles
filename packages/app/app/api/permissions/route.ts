import { NextResponse } from "next/server"
import { checkIntegrity } from "zodiac-roles-sdk"
import { kv } from "@vercel/kv"
import { createHash } from "crypto"
import { z } from "zod"
import { zAnnotation, zTarget } from "@/components/permissions/schema"

export async function POST(req: Request) {
  const json = await req.json()

  const zParams = z.object({
    targets: z.array(zTarget),
    annotations: z.array(zAnnotation),
  })

  let validated: z.infer<typeof zParams>
  try {
    validated = zParams.parse(json)
  } catch (e) {
    return NextResponse.json({
      error: "Json is invalid",
    })
  }

  try {
    checkIntegrity(validated.targets)
  } catch (e) {
    return NextResponse.json({
      error: "Targets integrity check failed",
    })
  }

  const stringValue = JSON.stringify(validated)
  const key = hash(stringValue)
  await kv.set(key, stringValue)

  return NextResponse.json({ hash: key })
}

/** URL-safe hash function */
function hash(value: string) {
  const b64 = createHash("sha256").update(value).digest("base64")
  // Make URL safe
  return b64.replace(/\+/g, "").replace(/\//g, "").replace(/=+$/, "")
}
