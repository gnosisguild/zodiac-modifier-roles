import { Function } from "zodiac-roles-deployments"

import { Call } from "../calls"
import { normalizeCondition } from "../conditions"
import {
  Diff,
  isExecutionOptionsMinus,
  isExecutionOptionsPlus,
  merge,
} from "./helpers"

export function diffFunctions({
  roleKey,
  targetAddress,
  prev,
  next,
}: {
  roleKey: string
  targetAddress: string
  prev?: Function[]
  next?: Function[]
}): Diff {
  const allSelectors = Array.from(
    new Set([
      ...(prev || []).map(({ selector }) => selector),
      ...(next || []).map(({ selector }) => selector),
    ])
  )

  return allSelectors
    .map((selector) =>
      diffFunction({
        roleKey,
        targetAddress,
        prev: prev?.find((fn) => fn.selector == selector),
        next: next?.find((fn) => fn.selector == selector),
      })
    )
    .reduce(merge, { minus: [], plus: [] })
}

export function diffFunction({
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
  const call = draftCall({
    roleKey,
    targetAddress,
    selector: (prev?.selector || next?.selector) as string,
    fn: next,
  })

  return {
    minus: isMinus(prev, next) ? [call] : [],
    plus: isPlus(prev, next) ? [call] : [],
  }
}
function draftCall({
  roleKey,
  targetAddress,
  selector,
  fn,
}: {
  roleKey: string
  targetAddress: string
  selector: string
  fn?: Function
}): Call {
  if (!fn) {
    return {
      call: "revokeFunction",
      roleKey,
      targetAddress,
      selector,
    }
  }

  return fn.wildcarded
    ? {
        call: "allowFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: fn.executionOptions,
      }
    : {
        call: "scopeFunction",
        roleKey,
        targetAddress,
        selector,
        executionOptions: fn.executionOptions,
        condition: normalizeCondition(fn.condition!),
      }
}

function isPlus(prev: Function | undefined, next: Function | undefined) {
  // if the function previously did not exist
  if (!prev && next) {
    return true
  }

  const prevIsScoped = !!prev?.condition
  const nextIsScoped = !!next?.condition
  const nextIsWildcarded = next?.wildcarded === true

  // if previously scoped, and now wildcarded
  if (prevIsScoped && nextIsWildcarded) {
    return true
  }

  // if both scoped, but conditions differ
  if (prevIsScoped && nextIsScoped && !scopedAndEqual(prev, next)) {
    return true
  }

  // if both logically equal, but ExecutionOptions plus
  if (
    (scopedAndEqual(prev, next) || wildcardedAndEqual(prev, next)) &&
    isExecutionOptionsPlus(prev!.executionOptions, next!.executionOptions)
  ) {
    return true
  }

  return false
}

function isMinus(prev: Function | undefined, next: Function | undefined) {
  // if the function does not exist anymore
  if (prev && !next) {
    return true
  }

  const nextIsScoped = !!next?.condition
  const prevIsWildcarded = prev?.wildcarded === true

  // if previously wildcarded and now scoped
  if (prevIsWildcarded && nextIsScoped) {
    return true
  }

  // if both logically equal, but ExecutionOptions minus
  if (
    (scopedAndEqual(prev, next) || wildcardedAndEqual(prev, next)) &&
    isExecutionOptionsMinus(prev!.executionOptions, next!.executionOptions)
  ) {
    return true
  }

  return false
}

function scopedAndEqual(a?: Function, b?: Function) {
  return (
    a?.condition &&
    b?.condition &&
    normalizeCondition(a.condition).$$id ===
      normalizeCondition(b.condition).$$id
  )
}

function wildcardedAndEqual(a?: Function, b?: Function) {
  return (
    typeof a?.wildcarded == "boolean" &&
    typeof b?.wildcarded == "boolean" &&
    a.wildcarded === b?.wildcarded
  )
}
