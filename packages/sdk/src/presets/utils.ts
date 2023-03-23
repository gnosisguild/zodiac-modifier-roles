import { keccak256, toUtf8Bytes } from "ethers/lib/utils"

import { PresetAllowEntry, PresetFunction } from "./types"

export const sighash = (signature: string): string =>
  keccak256(toUtf8Bytes(signature)).substring(0, 10)

export const isScoped = (entry: PresetAllowEntry): entry is PresetFunction =>
  "selector" in entry || "signature" in entry

export const functionId = (entry: PresetFunction) =>
  `${entry.targetAddress.toLowerCase()}.${
    "selector" in entry ? entry.selector : sighash(entry.signature)
  }`
