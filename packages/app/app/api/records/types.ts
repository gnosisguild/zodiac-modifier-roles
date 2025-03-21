import { zAddress, zHex } from "@/components/permissions/schema"
import { z } from "zod"

export enum Operation {
  Call = 0,
  DelegateCall = 1,
}

export const zCallInput = z.object({
  to: zAddress,
  value: z.string(),
  data: zHex,
  operation: z.nativeEnum(Operation),
  metadata: z
    .object({
      label: z.string().optional(),
      recordedAt: z.string().datetime().optional(),
      recordedWith: z.string().optional(),
    })
    .optional(),
})

export const zCall = zCallInput.extend({
  id: z.string(),
})
export type Call = z.infer<typeof zCall>

export const zWildcards = z.record(
  z.string(), // <target>:<selector>
  z
    .record(
      z.string(), // param path
      z.boolean().optional() // true if wildcarded
    )
    .optional()
)

export type Wildcards = z.infer<typeof zWildcards>

export const zRecord = z.object({
  id: z.string(),
  authToken: z.string(), // providing this token will allow the user to edit the record
  calls: z.record(z.string(), zCall), // store calls under their IDs
  wildcards: zWildcards, // allows wildcarding fields in the calls
  createdAt: z.string().datetime(),
  lastUpdatedAt: z.string().datetime(),
})

export type Record = z.infer<typeof zRecord>
