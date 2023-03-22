import { Call } from "./types"

/**
 * Remove all permission adjustment calls that are obsolete, because there are subsequent calls overriding their effects.
 * @param calls to filter
 * @returns The filtered calls
 */
export const removeObsoleteCalls = (calls: Call[]): Call[] => {
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

const isOverriddenBy = (obsolete: Call, override: Call) => {
  if (obsolete.targetAddress !== override.targetAddress) return false

  if (override.call === "allowTarget" || override.call === "revokeTarget") {
    if (
      obsolete.call === "allowTarget" ||
      obsolete.call === "revokeTarget" ||
      obsolete.call === "scopeTarget" ||
      obsolete.call === "scopeFunction" ||
      obsolete.call === "allowFunction" ||
      obsolete.call === "revokeFunction"
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
    override.call === "allowFunction" ||
    override.call === "revokeFunction" ||
    override.call === "scopeFunction"
  ) {
    if (
      obsolete.call === "allowFunction" ||
      obsolete.call === "revokeFunction" ||
      obsolete.call === "scopeFunction"
    ) {
      return obsolete.selector === override.selector
    }
  }

  return false
}
