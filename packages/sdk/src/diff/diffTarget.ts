import { invariant } from "@epic-web/invariant"

import { Clearance, Target } from "zodiac-roles-deployments"
import diffFunction from "./diffFunction"

import {
  Diff,
  isClearanceMinus,
  isClearancePlus,
  isExecutionOptionsMinus,
  isExecutionOptionsPlus,
  merge,
} from "./helpers"

export default function diffTarget({
  roleKey,
  targetAddress,
  prev,
  next,
}: {
  roleKey: string
  targetAddress: string
  prev?: Target
  next?: Target
}): Diff {
  const result: Diff = { minus: [], plus: [] }

  if (isPlus(prev, next)) {
    invariant(!!next, "Plus not undefined")
    result.plus = [
      next.clearance == Clearance.Target
        ? {
            call: "allowTarget",
            roleKey,
            targetAddress,
            executionOptions: next.executionOptions,
          }
        : { call: "scopeTarget", roleKey, targetAddress },
    ]
  }

  if (isMinus(prev, next)) {
    invariant(!!prev, "Plus not undefined")
    result.minus = [
      next
        ? { call: "scopeTarget", roleKey, targetAddress }
        : { call: "revokeTarget", roleKey, targetAddress },
    ]
  }

  const selectors = Array.from(
    new Set([
      ...(prev?.functions || []).map(({ selector }) => selector),
      ...(next?.functions || []).map(({ selector }) => selector),
    ])
  )

  return selectors
    .map((selector) =>
      diffFunction({
        roleKey,
        targetAddress,
        prev: prev?.functions?.find((fn) => fn.selector == selector),
        next: next?.functions?.find((fn) => fn.selector == selector),
      })
    )
    .reduce((result, { minus, plus }) => merge(result, { minus, plus }), result)
}

function isPlus(prev: Target | undefined, next: Target | undefined) {
  if (isClearancePlus(prev?.clearance, next?.clearance)) {
    return true
  }

  const bothClearanceTarget =
    prev?.clearance === Clearance.Target && next?.clearance === Clearance.Target

  if (
    bothClearanceTarget &&
    isExecutionOptionsPlus(prev.executionOptions, next.executionOptions)
  ) {
    return true
  }

  return false
}

function isMinus(prev: Target | undefined, next: Target | undefined) {
  if (isClearanceMinus(prev?.clearance, next?.clearance)) {
    return true
  }
  const bothClearanceTarget =
    prev?.clearance === Clearance.Target && next?.clearance === Clearance.Target

  if (
    bothClearanceTarget &&
    isExecutionOptionsMinus(prev?.executionOptions, next?.executionOptions)
  ) {
    return true
  }

  return false
}
