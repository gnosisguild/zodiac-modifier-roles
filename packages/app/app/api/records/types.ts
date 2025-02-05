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

export type Call = z.infer<typeof zCall>

export const zRecord = z.object({
  authToken: z.string(), // providing this token will allow the user to edit the record
  calls: z.array(zCall),
  wildcards: z.boolean(), // allows wildcarding fields in the calls
  alternatives: z.boolean(), // allows alternative values for fields in the calls
  lastUpdated: z.date(),
})

export type Record = z.infer<typeof zRecord>
