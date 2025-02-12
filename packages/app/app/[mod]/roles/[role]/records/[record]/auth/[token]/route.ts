import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { kv } from "@vercel/kv"
import { zRecord } from "@/app/api/records/types"
import { withErrorHandling } from "@/app/api/utils/withErrorHandling"

export const GET = withErrorHandling(
  async (
    req: Request,
    { params }: { params: { record: string; token: string } }
  ) => {
    // Get record from KV store
    const value = await kv.get(params.record)
    if (!value) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    const record = zRecord.parse(value)

    if (
      !timingSafeEqual(
        new Uint8Array(Buffer.from(params.token)),
        new Uint8Array(Buffer.from(record.authToken))
      )
    ) {
      return NextResponse.json({ error: "Invalid auth token" }, { status: 403 })
    }

    const html = `
      <html>
        <body>
          <script>
            localStorage.setItem('authToken:${params.record}', '${record.authToken}');
            window.location.href = '../'; // Redirect to the record page
          </script>
        </body>
      </html>
    `

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
      status: 200,
    })
  }
)
