import { NextResponse } from "next/server"
import { ZodError } from "zod"

export function withErrorHandling<T>(
  handler: (req: Request, context: T) => Promise<Response>
) {
  return async (req: Request, context: T): Promise<Response> => {
    try {
      return await handler(req, context)
    } catch (error) {
      // If the error is a Zod error, return a 400 response with details.
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        }))
        return NextResponse.json({ error: formattedErrors }, { status: 400 })
      }
      // Log unexpected errors for debugging.
      console.error("Unexpected error in API handler:", error)
      // For all other errors, return a generic 500 error.
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}
