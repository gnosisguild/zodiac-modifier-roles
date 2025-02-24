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

  if (prev === Clearance.None && next !== Clearance.None) {
    return true
  }

  if (prev === Clearance.Function && next === Clearance.Target) {
    return true
  }

  return false
}

export function isClearanceMinus(
  prev: Clearance | undefined,
  next: Clearance | undefined
) {
  prev = prev || Clearance.None
  next = next || Clearance.None

  if (next === Clearance.Function && prev === Clearance.Target) {
    return true
  }

  if (next === Clearance.None && prev !== Clearance.None) {
    return true
  }

  return false
}

export function isExecutionOptionsPlus(
  prev: ExecutionOptions,
  next: ExecutionOptions
) {
  if (prev === ExecutionOptions.None && next !== ExecutionOptions.None) {
    return true
  }

  if (
    (prev === ExecutionOptions.Send ||
      prev === ExecutionOptions.DelegateCall) &&
    next === ExecutionOptions.Both
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
    (prev === ExecutionOptions.Send ||
      prev === ExecutionOptions.DelegateCall) &&
    next === ExecutionOptions.None
  ) {
    return true
  }

  return false
}
