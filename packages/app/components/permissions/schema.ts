import { getAddress } from "viem"
import z from "zod"
import {
  Condition,
  Operator,
  ParameterType,
  Clearance,
  ExecutionOptions,
} from "zodiac-roles-sdk"

const zAddress = z.string().transform((val, ctx) => {
  try {
    return getAddress(val).toLowerCase() as `0x${string}`
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Address checksum is invalid",
    })
    return z.NEVER
  }
})

const zHex = z
  .string()
  .regex(/^0x[0-9a-fA-F]*$/)
  .transform((value) => value.toLowerCase() as `0x${string}`)

const zCondition = z.object({
  paramType: z.nativeEnum(ParameterType),
  operator: z.nativeEnum(Operator),
  compValue: zHex.optional(),
  children: z.lazy(() => z.array(zCondition)).optional(),
}) as z.ZodType<Condition>

export const zPermission = z.union([
  // order in the union matters! parse will use the first matching union member

  z.object({
    targetAddress: zAddress,
    selector: zHex,
    condition: zCondition.optional(),
    send: z.boolean().optional(),
    delegatecall: z.boolean().optional(),
  }),

  z.object({
    targetAddress: zAddress,
    send: z.boolean().optional(),
    delegatecall: z.boolean().optional(),
  }),
])

const zFunction = z.object({
  selector: zHex,
  executionOptions: z.nativeEnum(ExecutionOptions),
  wildcarded: z.boolean(),
  condition: zCondition.optional(),
})

export const zTarget = z.object({
  address: zAddress,
  clearance: z.nativeEnum(Clearance),
  executionOptions: z.nativeEnum(ExecutionOptions),
  functions: z.array(zFunction),
})

export const zAnnotation = z.object({
  uri: z.string(),
  schema: z.string(),
})
