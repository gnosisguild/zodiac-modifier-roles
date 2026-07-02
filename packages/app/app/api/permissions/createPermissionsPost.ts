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
  // Hash only the permission content so identical permissions stay
  // content-addressed (dedup). The `createdAt` timestamp is stored alongside
  // but excluded from the hash — it lets the diff page tell whether a post
  // came through the legacy Roles app flow after it was sunset.
  const key = hash(JSON.stringify({ targets, annotations, members }))
  await kv.set(
    key,
    JSON.stringify({ targets, annotations, members, createdAt: Date.now() })
  )
  return key
}

/** URL-safe hash function */
function hash(value: string) {
  const b64 = createHash("sha256").update(value).digest("base64")
  // Make URL safe
  return b64.replace(/\+/g, "").replace(/\//g, "").replace(/=+$/, "")
}
