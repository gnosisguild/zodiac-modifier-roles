import { Target, Annotation } from "zodiac-roles-sdk"
import { kv } from "@vercel/kv"
import { createHash } from "crypto"

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

/** URL-safe hash function */
function hash(value: string) {
  const b64 = createHash("sha256").update(value).digest("base64")
  // Make URL safe
  return b64.replace(/\+/g, "").replace(/\//g, "").replace(/=+$/, "")
}
