import { BigNumberish, BytesLike } from "ethers"
import { concat, hexlify, ParamType, zeroPad } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"
import { Placeholder } from "../../types"

import { ConditionFunction } from "./types"
import { describeStructure, parameterType, encodeValue } from "./utils"

/**
 * Asserts that the value from calldata is equal to the given value
 * @param value The reference value to encode or a placeholder
 */
export const eq =
  (value: Placeholder<any> | any): ConditionFunction<any> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    const structure = describeStructure(type)
    return {
      paramType: parameterType(type),
      operator: Operator.EqualTo,
      compValue: encodeValue(value, type),
      children: structure.children,
    }
  }

/**
 * Asserts that the value from calldata is greater than the given value
 * @param value The reference value to encode or a placeholder
 */
export const gt =
  (
    value: Placeholder<BigNumberish> | BigNumberish
  ): ConditionFunction<BigNumberish> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    if (!type.type.startsWith("uint") || !type.type.startsWith("int")) {
      throw new Error("`gt` is only supported for uint and int params")
    }
    return {
      paramType: ParameterType.Static,
      operator: type.type.startsWith("uint")
        ? Operator.GreaterThan
        : Operator.SignedIntGreaterThan,
      compValue: encodeValue(value, abiType),
    }
  }

/**
 * Asserts that the value from calldata is greater than the given value
 * @param value The reference value to encode or a placeholder
 */
export const lt =
  (
    value: Placeholder<BigNumberish> | BigNumberish
  ): ConditionFunction<BigNumberish> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    if (!type.type.startsWith("uint") || !type.type.startsWith("int")) {
      throw new Error("`lt` is only supported for uint and int params")
    }
    return {
      paramType: ParameterType.Static,
      operator: type.type.startsWith("uint")
        ? Operator.LessThan
        : Operator.SignedIntLessThan,
      compValue: encodeValue(value, abiType),
    }
  }

/**
 * Asserts that the bits selected by the mask at the given bytes offset equal the given value
 */
export const bitmask =
  ({ shift = 0, mask, value }: Bitmask): ConditionFunction<BytesLike> =>
  (abiType: ParamType) => {
    const paramType = parameterType(ParamType.from(abiType))

    if (
      paramType !== ParameterType.Static &&
      paramType !== ParameterType.Dynamic
    ) {
      throw new Error(
        `Bitmask can only be used for parameters with type Static or Dynamic, got: ${ParameterType[paramType]}`
      )
    }

    // TODO better errors for values that don't fit
    return {
      paramType,
      operator: Operator.Bitmask,
      compValue: hexlify(
        concat([
          zeroPad(hexlify(shift), 2),
          zeroPad(mask, 15),
          zeroPad(value, 15),
        ])
      ),
    }
  }

interface Bitmask {
  /** Offset in bytes at which to apply the mask, defaults to `0` */
  shift?: number
  /** The 15 bytes bitmask, each `1` means the bit at that position will be compared against the comparison value bit at the same position  */
  mask: BytesLike
  /** The 15 bytes comparison value, defines the expected value (`0` or `1`) for the bit at that position */
  value: BytesLike
}
