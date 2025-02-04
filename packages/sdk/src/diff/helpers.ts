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
  if (prev == ExecutionOptions.None && next != ExecutionOptions.None) {
    return true
  }

  if (
    (prev == ExecutionOptions.Send || prev === ExecutionOptions.DelegateCall) &&
    next == ExecutionOptions.Both
  ) {
    return true
  }

  return false
}

export function isExecutionOptionsMinus(
  prev: ExecutionOptions,
  next: ExecutionOptions
) {
  if (prev === ExecutionOptions.Both && next !== ExecutionOptions.Both) {
    return true
  }

  if (
    (prev == ExecutionOptions.Send || prev === ExecutionOptions.DelegateCall) &&
    next == ExecutionOptions.None
  ) {
    return true
  }

  return false
}
