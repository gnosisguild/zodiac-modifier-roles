import { Clearance, ExecutionOptions } from "zodiac-roles-deployments"
import { Call } from "../calls"

export type Diff = {
  minus: Call[]
  plus: Call[]
}

export function merge(diff1: Diff, diff2: Diff): Diff {
  return {
    minus: [...diff1.minus, ...diff2.minus],
    plus: [...diff1.plus, ...diff2.plus],
  }
}

export function isClearancePlus(
  prev: Clearance | undefined,
  next: Clearance | undefined
) {
  const isNone = (c?: Clearance) => c === Clearance.None || !c

  return (
    (isNone(prev) === true && isNone(next) === false) ||
    (prev === Clearance.Function && next == Clearance.Target)
  )
}

export function isClearanceMinus(
  prev: Clearance | undefined,
  next: Clearance | undefined
) {
  const isNone = (c?: Clearance) => c === Clearance.None || !c
  return (
    (prev === Clearance.Target && next !== Clearance.Target) ||
    (prev === Clearance.Function && isNone(next) === true)
  )
}

export function isExecutionOptionsPlus(
  prev: ExecutionOptions | undefined,
  next: ExecutionOptions | undefined
) {
  const isNone = (eo?: ExecutionOptions) => eo === ExecutionOptions.None || !eo

  if (isNone(prev) === true && isNone(next) === false) {
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
  prev: ExecutionOptions | undefined,
  next: ExecutionOptions | undefined
) {
  const isNone = (eo?: ExecutionOptions) => eo === ExecutionOptions.None || !eo

  if (prev === ExecutionOptions.Both && next !== ExecutionOptions.Both) {
    return true
  }

  if (
    (prev == ExecutionOptions.Send || prev === ExecutionOptions.DelegateCall) &&
    isNone(next)
  ) {
    return true
  }

  return false
}
