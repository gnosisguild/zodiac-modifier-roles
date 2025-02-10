import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"

export function authorizeRequest(
  req: Request,
  expectedToken: string
): NextResponse | null {
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Authorization header must be Bearer token",
        format: "Bearer <token>",
      },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7)
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 401 })
  }

  if (
    !timingSafeEqual(
      new Uint8Array(Buffer.from(token)),
      new Uint8Array(Buffer.from(expectedToken))
    )
  ) {
    return NextResponse.json(
      { error: "Invalid authorization" },
      { status: 403 }
    )
  }

  return null
}
