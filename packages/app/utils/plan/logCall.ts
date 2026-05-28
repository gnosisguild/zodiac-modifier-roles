import { ExecutionOptions } from "zodiac-roles-sdk"

import { conditionAddress } from "zodiac-roles-sdk"

import { Call } from "./Call"

export const logCall = (
  call: Call,
  log: (message: string) => void = console.log
) => {
  switch (call.call) {
    case "allowTarget": {
      const { targetAddress, executionOptions } = call
      log(
        `✅ Allow ${ExecutionOptionLabel[executionOptions]} to any function of ${targetAddress}`
      )
      break
    }

    case "scopeTarget": {
      const { targetAddress } = call
      log(`✅ Allow calling selected functions of ${targetAddress}`)
      break
    }

    case "revokeTarget": {
      const { targetAddress } = call
      log(`⛔ Revoke permissions to call any function of ${targetAddress}`)
      break
    }

    case "allowFunction": {
      const { targetAddress, selector, executionOptions } = call
      log(
        `✅ Allow ${ExecutionOptionLabel[executionOptions]} to ${targetAddress}.${selector}`
      )
      break
    }

    case "scopeFunction": {
      const { targetAddress, selector, executionOptions, condition } = call
      const cid = conditionAddress(condition)
      log(
        `✅ Allow ${ExecutionOptionLabel[executionOptions]} to ${targetAddress}.${selector} under condition ${cid}`
      )
      break
    }

    case "revokeFunction": {
      const { targetAddress, selector } = call
      log(`⛔ Revoke permissions to call ${targetAddress}.${selector}`)
      break
    }

    case "assignRoles": {
      const { member, join } = call
      log(join ? `👤 Add member ${member}` : `👤 Remove member ${member}`)
      break
    }

    case "setAllowance": {
      const { key, balance, maxRefill, refill, period, timestamp } = call
      const isUnset = !balance && !maxRefill && !refill && !period && !timestamp
      log(`💰 ${isUnset ? "Unset" : "Set"} allowance ${key}`)
      break
    }

    case "postAnnotations": {
      const { addAnnotations, removeAnnotations } = call.body
      const addCount =
        addAnnotations?.reduce((acc, add) => acc + add.uris.length, 0) || 0
      const removeCount = removeAnnotations?.length || 0
      const message = [
        addCount > 0 ? "add " + pluralize(addCount, "annotation") : undefined,
        removeCount > 0
          ? "remove " + pluralize(removeCount, "annotation")
          : undefined,
      ]
        .filter(Boolean)
        .join(", ")

      log(`💬 ${message[0].toUpperCase()}${message.slice(1)}`)
      break
    }
  }
}

const ExecutionOptionLabel = {
  [ExecutionOptions.None]: "call",
  [ExecutionOptions.DelegateCall]: "call, delegatecall",
  [ExecutionOptions.Send]: "call, send",
  [ExecutionOptions.Both]: "call, delegatecall, send",
}

const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`
) => {
  if (count === 1) {
    return `1 ${singular}`
  }
  return `${count} ${plural}`
}
