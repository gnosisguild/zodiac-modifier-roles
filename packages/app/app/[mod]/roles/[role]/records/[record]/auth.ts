import { timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

export async function isAuthorized(expectedToken: string) {
  const authToken = (await cookies()).get("authToken")?.value
  const buffer = new Uint8Array(Buffer.from(authToken || ""))
  const expectedBuffer = new Uint8Array(Buffer.from(expectedToken))
  return (
    buffer.length === expectedBuffer.length &&
    timingSafeEqual(buffer, expectedBuffer)
  )
}
