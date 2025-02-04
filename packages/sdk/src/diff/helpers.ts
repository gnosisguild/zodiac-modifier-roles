import { Clearance, ExecutionOptions } from "zodiac-roles-deployments"
import { Call } from "../calls"

export type Diff = {
  minus: Call[]
  plus: Call[]
}

export function merge(prev: Diff, next: Diff): Diff {
  return {
    minus: [...prev.minus, ...next.minus],
    plus: [...prev.plus, ...next.plus],
  }
}

export function isClearancePlus(
  prev: Clearance | undefined,
  next: Clearance | undefined
) {
  prev = prev || Clearance.None
  next = next || Clearance.None
  return next > prev
}

export function isClearanceMinus(
  prev: Clearance | undefined,
  next: Clearance | undefined
) {
  prev = prev || Clearance.None
  next = next || Clearance.None
  return prev > next
}

export function isExecutionOptionsPlus(
  prev: ExecutionOptions,
  next: ExecutionOptions
) {
  if (
    [prev, next].every((eo) =>
      [ExecutionOptions.Send, ExecutionOptions.DelegateCall].includes(eo)
    )
  ) {
    return false
  }

  return next > prev
}

export function isExecutionOptionsMinus(
  prev: ExecutionOptions,
  next: ExecutionOptions
) {
  if (
    [prev, next].every((eo) =>
      [ExecutionOptions.Send, ExecutionOptions.DelegateCall].includes(eo)
    )
  ) {
    return false
  }

  return prev > next
}
