import { ExecutionOptions } from "zodiac-roles-deployments"

import { conditionAddress } from "../conditions"

import { Call } from "./types"

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
      log(join ? `👤 Add member ${member}` : `👤 Add Remove ${member}`)
      break
    }

    case "setAllowance": {
      const { key, balance, maxRefill, refill, period, timestamp } = call
      const isUnset = !balance && !maxRefill && !refill && !period && !timestamp
      log(`💰 ${isUnset ? "Unset" : "Set"} allowance ${key}`)
      break
    }

    // default:
    //   log(`Unhandled call ${call.call}`)
  }
}

const ExecutionOptionLabel = {
  [ExecutionOptions.None]: "call",
  [ExecutionOptions.DelegateCall]: "call, delegatecall",
  [ExecutionOptions.Send]: "call, send",
  [ExecutionOptions.Both]: "call, delegatecall, send",
}
