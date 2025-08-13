import { Clearance, Target } from "zodiac-roles-deployments"

import { diffFunctions } from "./function"

import {
  Diff,
  isClearanceMinus,
  isClearancePlus,
  isExecutionOptionsMinus,
  isExecutionOptionsPlus,
  merge,
} from "./helpers"
import { Call } from "../calls"

export function diffTargets({
  roleKey,
  prev,
  next,
}: {
  roleKey: `0x${string}`
  prev?: Target[]
  next?: Target[]
}) {
  const allTargetAddresses = Array.from(
    new Set([
      ...(prev?.map(({ address }) => address) || []),
      ...(next?.map(({ address }) => address) || []),
    ])
  )

  return allTargetAddresses
    .map((targetAddress) =>
      diffTarget({
        roleKey,
        prev: prev?.find(({ address }) => address === targetAddress),
        next: next?.find(({ address }) => address === targetAddress),
      })
    )
    .reduce(merge, { minus: [], plus: [] })
}

export function diffTarget({
  roleKey,
  prev,
  next,
}: {
  roleKey: `0x${string}`
  prev?: Target
  next?: Target
}): Diff {
  const targetAddress = (prev?.address || next?.address)!

  const call = draftCall({
    roleKey,
    targetAddress,
    target: next,
  })

  const result: Diff = {
    minus: isMinus(prev, next) ? [call] : [],
    plus: isPlus(prev, next) ? [call] : [],
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

function draftCall({
  roleKey,
  targetAddress,
  target,
}: {
  roleKey: `0x${string}`
  targetAddress: `0x${string}`
  target?: Target
}): Call {
  const clearance = target?.clearance || Clearance.None

  if (clearance === Clearance.None) {
    return {
      call: "revokeTarget",
      roleKey,
      targetAddress,
    }
  }

  if (clearance == Clearance.Function) {
    return {
      call: "scopeTarget",
      roleKey,
      targetAddress,
    }
  }

  return {
    call: "allowTarget",
    roleKey,
    targetAddress,
    executionOptions: target!.executionOptions,
  }
}

function isPlus(prev: Target | undefined, next: Target | undefined) {
  if (isClearancePlus(prev?.clearance, next?.clearance)) {
    return true
  }

  const bothClearanceTarget =
    prev?.clearance === Clearance.Target && next?.clearance === Clearance.Target

  return (
    bothClearanceTarget &&
    isExecutionOptionsPlus(prev.executionOptions, next.executionOptions)
  )
}

function isMinus(prev: Target | undefined, next: Target | undefined) {
  if (isClearanceMinus(prev?.clearance, next?.clearance)) {
    return true
  }
  const bothClearanceTarget =
    prev?.clearance === Clearance.Target && next?.clearance === Clearance.Target

  return (
    bothClearanceTarget &&
    isExecutionOptionsMinus(prev?.executionOptions, next?.executionOptions)
  )
}
