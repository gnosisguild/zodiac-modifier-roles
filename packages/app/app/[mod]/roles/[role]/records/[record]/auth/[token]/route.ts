import { NextResponse } from "next/server"

export const GET = async (
  req: Request,
  props: { params: Promise<{ mod: string; role: string; record: string; token: string }> }
) => {
  const params = await props.params;

  const {
    mod,
    role,
    record,
    token
  } = params;

  const path = `/${mod}/roles/${role}/records/${record}`
  const res = NextResponse.redirect(new URL(path, req.url))
  res.cookies.set("authToken", token, {
    path,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 2147483647,
  })
  return res
}
