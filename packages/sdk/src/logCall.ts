import { Call, Comparison, ExecutionOptions, Parameter } from "./types"

const logCall = (call: Call, log = console.log) => {
  switch (call.call) {
    case "allowTarget": {
      log(
        `✅ Allow ${ExecutionOptionLabel[call.options]} to any function of ${
          call.targetAddress
        }`
      )
      break
    }

    case "scopeTarget": {
      log(`✅ Allow executing selected functions of ${call.targetAddress}`)
      break
    }

    case "scopeAllowFunction": {
      const { targetAddress, functionSig, options } = call
      log(
        `✅ Allow ${ExecutionOptionLabel[options]} to ${targetAddress}.${functionSig}`
      )
      break
    }

    case "scopeFunction": {
      const { paramComp, compValue } = call
      const params = call.isParamScoped.map((isParamScoped, i) =>
        isParamScoped
          ? `${ComparisonLabel[paramComp[i]]}${compValue[i]}`
          : "any"
      )
      log(
        `✅ Allow ${ExecutionOptionLabel[call.options]} to ${
          call.targetAddress
        }.${call.functionSig} with params (${params.join(", ")})`
      )
      break
    }

    case "scopeFunctionExecutionOptions": {
      const { targetAddress, functionSig, options } = call
      log(
        `⚙️ Set allowed execution options of ${targetAddress}.${functionSig} to ${ExecutionOptionLabel[options]}`
      )
      break
    }

    case "scopeParameterAsOneOf": {
      const { targetAddress, functionSig, paramIndex, type, value } = call
      log(
        `⛔ Restrict allowed value for parameter #${paramIndex} of ${targetAddress}.${functionSig} to one of: ${value.join(
          " | "
        )}`
      )
      break
    }

    case "revokeTarget": {
      log(
        `⛔ Revoke permissions to execute any function of ${call.targetAddress}`
      )
      break
    }

    case "scopeRevokeFunction": {
      const { targetAddress, functionSig } = call
      log(`⛔ Revoke permissions to execute ${targetAddress}.${functionSig}`)
      break
    }

    case "unscopeParameter": {
      log(`✅ Allow any value for parameter #${call.paramIndex}`)
      break
    }
  }
}

export default logCall

const ExecutionOptionLabel = {
  [ExecutionOptions.None]: "call",
  [ExecutionOptions.DelegateCall]: "call, delegatecall",
  [ExecutionOptions.Send]: "call, send",
  [ExecutionOptions.Both]: "call, delegatecall, send",
}

const ComparisonLabel = {
  [Comparison.EqualTo]: "",
  [Comparison.GreaterThan]: ">",
  [Comparison.LessThan]: "<",
}
