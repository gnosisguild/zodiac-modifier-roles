import { timingSafeEqual } from "crypto"
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";

export function isAuthorized(expectedToken: string) {
  const authToken = (cookies() as unknown as UnsafeUnwrappedCookies).get("authToken")?.value
  return (
    !!authToken &&
    timingSafeEqual(
      new Uint8Array(Buffer.from(authToken)),
      new Uint8Array(Buffer.from(expectedToken))
    )
  )
}
