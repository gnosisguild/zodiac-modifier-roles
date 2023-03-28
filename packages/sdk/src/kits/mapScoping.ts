import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber"
import { ParamType } from "ethers/lib/utils"

import { PresetCondition } from "../presets/types"

import { eq, matches } from "./conditions"
import { ConditionFunction, Scoping } from "./types"

/**
 * Maps a scoping (shortcut notation or condition function) to preset conditions.
 * @param scoping The scoping to map.
 * @param abiType The abi type of the parameter the scoping applies to.
 * @returns
 */
export function mapScoping(
  scoping: Scoping<any>,
  abiType: ParamType
): PresetCondition {
  let conditionFunction: ConditionFunction<any>

  if (typeof scoping === "function") {
    // scoping is already a condition function
    conditionFunction = scoping
  } else if (
    typeof scoping === "boolean" ||
    typeof scoping === "string" ||
    typeof scoping === "number" ||
    Array.isArray(scoping) ||
    isBigNumberish(scoping)
  ) {
    // primitive values and arrays default to eq condition
    conditionFunction = eq(scoping)
  } else {
    // object values default to matches condition
    conditionFunction = matches(scoping)
  }

  return conditionFunction(abiType)
}
