import { BigNumberish } from "ethers"
import { ParamType } from "ethers/lib/utils"

import * as l2 from "../presets/helpers"
import { Placeholder } from "../presets/types"

// build layer 3 (typed allow kit) comparison helpers based on layer 2 (permission preset condition helpers)

export const eq =
  <T>(value: T | Placeholder<T>) =>
  (abiType: ParamType) => {
    return l2.eq(value, abiType)
  }

export const gt =
  <T extends BigNumberish>(value: T | Placeholder<T>) =>
  (abiType: ParamType) => {
    return l2.gt(value, abiType)
  }

export const lt =
  <T extends BigNumberish>(value: T | Placeholder<T>) =>
  (abiType: ParamType) => {
    return l2.lt(value, abiType)
  }
