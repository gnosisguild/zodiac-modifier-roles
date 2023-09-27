import z from "zod"
import {
  Condition,
  Operator,
  ParameterType,
  Clearance,
  ExecutionOptions,
} from "zodiac-roles-sdk"

const zCondition: z.ZodType<Condition> = z.object({
  paramType: z.nativeEnum(ParameterType),
  operator: z.nativeEnum(Operator),
  compValue: z.string().optional(),
  children: z.lazy(() => z.array(zCondition)).optional(),
})

export const zPermission = z.union([
  // order in the union matters! parse will use the first matching union member

  z.object({
    targetAddress: z.string(),
    selector: z.string(),
    condition: zCondition.optional(),
    send: z.boolean().optional(),
    delegateCall: z.boolean().optional(),
  }),

  z.object({
    targetAddress: z.string(),
    send: z.boolean().optional(),
    delegateCall: z.boolean().optional(),
  }),
])

const zFunction = z.object({
  selector: z.string(),
  executionOptions: z.nativeEnum(ExecutionOptions),
  wildcarded: z.boolean(),
  condition: zCondition.optional(),
})

export const zTarget = z.object({
  address: z.string(),
  clearance: z.nativeEnum(Clearance),
  executionOptions: z.nativeEnum(ExecutionOptions),
  functions: z.array(zFunction),
})

export const zAnnotation = z.object({
  uri: z.string(),
  schema: z.string(),
})
