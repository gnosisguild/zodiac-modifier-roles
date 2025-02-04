import { invariant } from "@epic-web/invariant"

import { Clearance, Target } from "zodiac-roles-deployments"
import { diffFunctions } from "./diffFunction"

import {
  Diff,
  isClearanceMinus,
  isClearancePlus,
  isExecutionOptionsMinus,
  isExecutionOptionsPlus,
  merge,
} from "./helpers"

export function diffTargets({
  roleKey,
  prev,
  next,
}: {
  roleKey: string
  prev?: Target[]
  next?: Target[]
}) {
  const targetAddresses = Array.from(
    new Set([
      ...(prev?.map(({ address }) => address) || []),
      ...(next?.map(({ address }) => address) || []),
    ])
  )

  return targetAddresses
    .map((targetAddress) =>
      diffTarget({
        roleKey,
        targetAddress,
        prev: prev?.find(({ address }) => address == targetAddress),
        next: prev?.find(({ address }) => address == targetAddress),
      })
    )
    .reduce(merge, { minus: [], plus: [] })
}

export function diffTarget({
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

  return merge(
    result,
    diffFunctions({
      roleKey,
      targetAddress,
      prev: prev?.functions,
      next: next?.functions,
    })
  )
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
