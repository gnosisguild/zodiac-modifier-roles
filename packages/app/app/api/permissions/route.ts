import { NextResponse } from "next/server"
import { targetIntegrity } from "zodiac-roles-sdk"
import { kv } from "@vercel/kv"
import { createHash } from "crypto"
import { PermissionsPost, zPermissionsPost } from "./types"

export async function POST(req: Request) {
  const json = await req.json()

  let validated: PermissionsPost
  try {
    validated = zPermissionsPost.parse(json)
  } catch (e) {
    return NextResponse.json({
      error: "Json is invalid",
    })
  }

  if (validated.targets) {
    try {
      targetIntegrity(validated.targets)
    } catch (e) {
      return NextResponse.json({
        error: "Targets integrity check failed",
      })
    }
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
