import { keccak256, ParamType, toUtf8Bytes } from "ethers/lib/utils"

import { ExecutionOptions as ExecutionOptionsEnum } from "../types"

import {
  PresetAllowEntry,
  PresetAllowEntryCoerced,
  PresetFunction,
  PresetFunctionCoerced,
  ExecutionFlags,
} from "./types"

export const execOptions = (options: ExecutionFlags): ExecutionOptionsEnum => {
  if (options.send && options.delegatecall) return ExecutionOptionsEnum.Both
  if (options.delegatecall) return ExecutionOptionsEnum.DelegateCall
  if (options.send) return ExecutionOptionsEnum.Send
  return ExecutionOptionsEnum.None
}

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
