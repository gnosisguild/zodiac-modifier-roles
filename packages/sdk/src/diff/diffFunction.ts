import { invariant } from "@epic-web/invariant"
import { Condition, Function } from "zodiac-roles-deployments"

import { Call } from "../calls"
import { normalizeCondition } from "../conditions"
import {
  Diff,
  isExecutionOptionsMinus,
  isExecutionOptionsPlus,
} from "./helpers"

export default function diffFunction({
  roleKey,
  targetAddress,
  prev,
  next,
}: {
  roleKey: string
  targetAddress: string
  prev?: Function
  next?: Function
}): Diff {
  if (isPlus(prev, next)) {
    invariant(!!next, "expected next to be defined")
    const call: Call = next.wildcarded
      ? {
          call: "allowFunction",
          roleKey,
          targetAddress,
          selector: next.selector,
          executionOptions: next.executionOptions,
        }
      : {
          call: "scopeFunction",
          roleKey,
          targetAddress,
          selector: next.selector,
          executionOptions: next.executionOptions,
          condition: normalizeCondition(next.condition!),
        }

    return { minus: [], plus: [call] }
  }

  if (isMinus(prev, next)) {
    invariant(!!prev, "expected prev to be defined")
    const call: Call = !next
      ? {
          call: "revokeFunction",
          roleKey,
          targetAddress,
          selector: prev.selector,
        }
      : {
          call: "scopeFunction",
          roleKey,
          targetAddress,
          selector: next.selector,
          executionOptions: next.executionOptions,
          condition: normalizeCondition(next.condition!),
        }

    return { minus: [call], plus: [] }
  }

  return { minus: [], plus: [] }
}

function isPlus(prev: Function | undefined, next: Function | undefined) {
  // if the function previously did not exist
  if (!prev && next) {
    return true
  }

  // if function previously is condition and now is wildcarded
  if (prev?.condition && next?.wildcarded === true) {
    return true
  }

  // if both conditions, but conditions differ
  if (
    prev?.condition &&
    next?.condition &&
    !conditionsEqual(prev.condition, next.condition)
  ) {
    return true
  }

  // if both conditions, and conditions equal, but executionOptions plus
  if (
    prev?.condition &&
    next?.condition &&
    conditionsEqual(prev.condition, next.condition) &&
    isExecutionOptionsPlus(prev.executionOptions, next.executionOptions)
  ) {
    return true
  }

  return false
}

function isMinus(prev: Function | undefined, next: Function | undefined) {
  // if the function previously did not exist
  if (prev && !next) {
    return true
  }

  // if function previously is was wildcarded and now is condition
  if (prev?.wildcarded && next?.condition) {
    return true
  }

  // if both conditions, and conditions equal, but executionOptions minus
  if (
    prev?.condition &&
    next?.condition &&
    conditionsEqual(prev.condition, next.condition) &&
    isExecutionOptionsMinus(prev.executionOptions, next.executionOptions)
  ) {
    return true
  }

  return false
}

function conditionsEqual(a: Condition, b: Condition) {
  return normalizeCondition(a).$$id === normalizeCondition(b).$$id
}
