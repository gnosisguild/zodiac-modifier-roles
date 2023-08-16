import z from "zod"

// zod schema for the OpenAPI schema types (OpenAPI spec v3.1.0)
// https://swagger.io/specification/#oas-document

// OpenAPI uses a superset of JSON Schema, but for now we're only considering a tiny subset of it
const zStringParameterSchema = z.object({
  type: z.literal("string"),
  enum: z.array(z.string()).optional(),
})
const zNumberParameterSchema = z.object({
  type: z.literal("number"),
})
const zArrayParameterSchema = z.object({
  type: z.literal("array"),
  items: z.union([zStringParameterSchema, zNumberParameterSchema]),
})
export const zParameterSchema = z.union([
  zStringParameterSchema,
  zNumberParameterSchema,
  zArrayParameterSchema,
])

export const zOpenApiOperation = z.object({
  tags: z.array(z.string()).default([]),
  summary: z.string().optional(),
  parameters: z
    .array(
      z.object({
        schema: zParameterSchema,
        required: z.boolean().default(false),
        name: z.string(),
        in: z.enum(["query", "header", "path", "cookie"]),
      })
    )
    .default([]),
})

export const zOpenApiObject = z.object({
  openapi: z.string(),
  info: z.object({
    title: z.string(),
    summary: z.string().optional(),
    version: z.string(),
    contact: z
      .object({
        name: z.string().optional(),
        url: z.string().optional(),
      })
      .optional(),
  }),
  servers: z.array(z.object({ url: z.string() })).default([]),
  paths: z.record(
    z.object({
      get: zOpenApiOperation.optional(),
    })
  ),
})
