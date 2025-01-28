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

export const zCallsCollection = z.object({
  authToken: z.string(), // providing this token will allow the user to edit the calls collection
  calls: z.array(zCall),
})

export type CallsCollection = z.infer<typeof zCallsCollection>

console.log(
  z.bigint().parse("123123123123123123123123123123123123123123123123")
)
