import { z } from "zod"
import crypto from "crypto"
import { Call, zCallInput } from "./types"

type CallInput = z.infer<typeof zCallInput>

/** Derives an id for a call from the call input, only using characters and numerals */
export const callId = (call: CallInput) => {
  const str =
    call.operation + BigInt(call.value).toString() + call.to + call.data

  // we must avoid +, /, and = as this might break redis ID references
  return crypto
    .createHash("md5")
    .update(str)
    .digest("base64")
    .replace(/[+/=]/g, "")
}

export const targetSelector = (call: CallInput) => {
  return `${call.to.toLowerCase()}:${call.data}`
}

export const indexCallInputs = (
  callInputs: CallInput[],
  skipIds: string[] = []
): { [id: string]: Call } => {
  return Object.fromEntries(
    callInputs
      .map((call) => {
        const id = callId(call)
        return [
          id,
          {
            ...call,
            id,
          },
        ] as const
      })
      .filter(([id]) => !skipIds.includes(id))
  )
}
