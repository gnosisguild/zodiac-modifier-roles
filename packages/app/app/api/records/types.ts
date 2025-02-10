import { zAddress, zHex } from "@/components/permissions/schema"
import { z } from "zod"

enum Operation {
  Call = 0,
  DelegateCall = 1,
}

export const zCall = z.object({
  to: zAddress,
  value: z.bigint(),
  data: zHex,
  operation: z.nativeEnum(Operation),
  metadata: z
    .object({
      label: z.string().optional(),
      recordedAt: z.date().optional(),
      recordedWith: z.string().optional(),
    })
    .optional(),
})

export const zWildcards = z.record(z.string(), z.boolean())

export const zAlternatives = z.record(z.string(), z.string())

export const zRecord = z.object({
  authToken: z.string(), // providing this token will allow the user to edit the record
  calls: z.array(zCall),
  wildcards: zWildcards, // allows wildcarding fields in the calls
  alternatives: zAlternatives, // allows alternative values for fields in the calls
  createdAt: z.date(), // timestamp of the initial creation
  lastUpdatedAt: z.date(), // timestamp of the last update
})

export type Record = z.infer<typeof zRecord>
