import { keccak256, ParamType, toUtf8Bytes } from "ethers/lib/utils"

import {
  PresetAllowEntry,
  PresetAllowEntryCoerced,
  PresetFunction,
  PresetFunctionCoerced,
} from "./types"

const sighash = (signature: string): string =>
  keccak256(toUtf8Bytes(signature)).substring(0, 10)

export const coercePresetFunction = (
  entry: PresetFunction
): PresetFunctionCoerced => {
  return {
    targetAddress: entry.targetAddress.toLowerCase(),
    selector:
      "selector" in entry
        ? entry.selector.toLowerCase()
        : sighash(entry.signature),
    condition:
      typeof entry.condition === "function"
        ? entry.condition(ParamType.from("bytes"))
        : entry.condition,
    send: entry.send,
    delegatecall: entry.delegatecall,
  }
}

export const isScoped = (entry: PresetAllowEntry): entry is PresetFunction => {
  return "selector" in entry || "signature" in entry
}

export const allowEntryId = (entry: PresetAllowEntryCoerced) =>
  "selector" in entry
    ? `${entry.targetAddress.toLowerCase()}.${entry.selector}`
    : entry.targetAddress.toLowerCase()
