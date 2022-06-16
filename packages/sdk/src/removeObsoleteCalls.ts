import { Call } from "./types"

// Remove all permission adjustment calls that are obsolete, because there are subsequent calls overriding their effects.
const removeObsoleteCalls = (calls: Call[]): Call[] => {
  if (calls.length <= 1) return calls

  // We start filtering from the end, and keep filtering against filtered interim result.
  // That way function permission updates won't be filtered out if followed by an allowTarget and then later followed by a scopeTarget.
  const result: Call[] = []
  for (let i = calls.length - 1; i >= 0; i--) {
    if (!result.some((laterCall) => isOverriddenBy(calls[i], laterCall))) {
      result.unshift(calls[i])
    }
  }

  return result
}

export default removeObsoleteCalls

const isOverriddenBy = (obsolete: Call, override: Call) => {
  if (obsolete.targetAddress !== override.targetAddress) return false

  if (override.call === "allowTarget" || override.call === "revokeTarget") {
    if (
      obsolete.call === "allowTarget" ||
      obsolete.call === "revokeTarget" ||
      obsolete.call === "scopeTarget" ||
      obsolete.call === "scopeFunction" ||
      obsolete.call === "scopeAllowFunction" ||
      obsolete.call === "scopeParameterAsOneOf" ||
      obsolete.call === "scopeRevokeFunction"
    ) {
      return true
    }
  }

  if (override.call === "scopeTarget") {
    if (
      obsolete.call === "allowTarget" ||
      obsolete.call === "revokeTarget" ||
      obsolete.call === "scopeTarget"
    ) {
      return true
    }
  }

  if (
    override.call === "scopeAllowFunction" ||
    override.call === "scopeRevokeFunction"
  ) {
    if (
      obsolete.call === "scopeAllowFunction" ||
      obsolete.call === "scopeRevokeFunction" ||
      obsolete.call === "scopeFunction" ||
      obsolete.call === "scopeParameterAsOneOf"
    ) {
      return obsolete.functionSig === override.functionSig
    }
  }

  if (
    override.call === "scopeFunction" ||
    override.call === "scopeParameterAsOneOf"
  ) {
    if (
      obsolete.call === "scopeAllowFunction" ||
      obsolete.call === "scopeRevokeFunction"
    ) {
      return obsolete.functionSig === override.functionSig
    }
  }

  if (override.call === "scopeFunction") {
    if (
      obsolete.call === "scopeFunction" ||
      obsolete.call === "scopeParameterAsOneOf"
    ) {
      return obsolete.functionSig === override.functionSig
    }
  }

  if (override.call === "scopeParameterAsOneOf") {
    if (obsolete.call === "scopeParameterAsOneOf") {
      return (
        obsolete.functionSig === override.functionSig &&
        obsolete.paramIndex === override.paramIndex
      )
    }
  }

  return false
}
