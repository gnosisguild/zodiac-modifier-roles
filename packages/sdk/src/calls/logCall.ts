import { getConditionId } from "../conditions/getConditionId"
import { ExecutionOptions } from "../types"

import { Call } from "./types"

export const logCall = (call: Call, log = console.log) => {
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
      log(`✅ Allow executing selected functions of ${targetAddress}`)
      break
    }

    case "revokeTarget": {
      const { targetAddress } = call
      log(`⛔ Revoke permissions to execute any function of ${targetAddress}`)
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
      const conditionId = getConditionId(condition)
      log(
        `✅ Allow ${ExecutionOptionLabel[executionOptions]} to ${targetAddress}.${selector} under condition ${conditionId}}`
      )
      break
    }

    case "revokeFunction": {
      const { targetAddress, selector } = call
      log(`⛔ Revoke permissions to execute ${targetAddress}.${selector}`)
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
