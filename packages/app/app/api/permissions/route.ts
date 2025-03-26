import { NextResponse } from "next/server"
import { Annotation, checkIntegrity, Target } from "zodiac-roles-sdk"
import { kv } from "@vercel/kv"
import { createHash } from "crypto"
import { zPermissionsPost } from "./types"
import { withErrorHandling } from "../utils/withErrorHandling"

export const createPermissionsPost = async ({
  targets,
  annotations,
  members,
}: {
  targets?: readonly Target[]
  annotations?: readonly Annotation[]
  members?: readonly `0x${string}`[]
}) => {
  const stringValue = JSON.stringify({ targets, annotations, members })
  const key = hash(stringValue)
  await kv.set(key, stringValue)
  return key
}

export const POST = withErrorHandling(async (req: Request) => {
  const json = await req.json()

  const validated = zPermissionsPost.parse(json)

  if (validated.targets) {
    try {
      checkIntegrity(validated.targets)
    } catch (e) {
      return NextResponse.json({
        error: "Targets integrity check failed",
      })
    }
  }

  const hash = await createPermissionsPost(validated)
  return NextResponse.json({ hash })
})

/** URL-safe hash function */
function hash(value: string) {
  const b64 = createHash("sha256").update(value).digest("base64")
  // Make URL safe
  return b64.replace(/\+/g, "").replace(/\//g, "").replace(/=+$/, "")
}
