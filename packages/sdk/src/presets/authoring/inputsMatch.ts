import { ParamType } from "ethers/lib/utils"

import { AbiType } from "../types"

import { matchesAbi } from "./conditions"
import { TupleScopings } from "./conditions/types"

/**
 * Entry point function for defining conditions when not using a typed allow kit
 * @param scoping The conditions structure over the function inputs
 * @param abiTypes The ABI types of the function inputs
 **/
export const inputsMatch = (
  scoping: TupleScopings<any>,
  abiTypes: AbiType[]
) => {
  return matchesAbi(
    scoping,
    abiTypes.map((abiType) => ParamType.from(abiType))
  )()
}
