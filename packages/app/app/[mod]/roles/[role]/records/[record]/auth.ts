import { timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

export function isAuthorized(expectedToken: string) {
  const authToken = cookies().get("authToken")?.value
  return (
    !!authToken &&
    timingSafeEqual(
      new Uint8Array(Buffer.from(authToken)),
      new Uint8Array(Buffer.from(expectedToken))
    )
  )
}
