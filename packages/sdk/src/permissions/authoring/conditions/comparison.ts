import { BigNumberish, BytesLike } from "ethers"
import { arrayify, concat, hexlify, ParamType, zeroPad } from "ethers/lib/utils"

import { Operator, ParameterType } from "../../../types"

import { ConditionFunction } from "./types"
import { describeStructure, parameterType, encodeValue } from "./utils"

/**
 * Asserts that the value from calldata is equal to the given value
 * @param value The reference value to encode
 */
export const eq =
  (value: any): ConditionFunction<any> =>
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
 * Asserts that the value from calldata is equal to the avatar address configured on the Roles mod
 */
export const avatar: ConditionFunction<string> = (abiType: ParamType) => {
  const type = ParamType.from(abiType)
  const structure = describeStructure(type)
  return {
    paramType: parameterType(type),
    operator: Operator.EqualToAvatar,
    children: structure.children,
  }
}

/**
 * Asserts that the value from calldata is greater than the given value
 * @param value The reference value to encode
 */
export const gt =
  (value: BigNumberish): ConditionFunction<BigNumberish> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    if (!type.type.startsWith("uint") && !type.type.startsWith("int")) {
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
 * @param value The reference value to encode
 */
export const lt =
  (value: BigNumberish): ConditionFunction<BigNumberish> =>
  (abiType: ParamType) => {
    const type = ParamType.from(abiType)
    if (!type.type.startsWith("uint") && !type.type.startsWith("int")) {
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

    if (shift < 0 || shift >= 65536) {
      throw new Error("shift is out of range, must be between 0 and 65535")
    }

    const maskBytes = arrayify(mask)
    if (maskBytes.length > 15) {
      throw new Error("mask is too long, maximum length is 15 bytes")
    }
    const valueBytes = arrayify(value)
    if (maskBytes.length > 15) {
      throw new Error("value is too long, maximum length is 15 bytes")
    }

    return {
      paramType,
      operator: Operator.Bitmask,
      compValue: hexlify(
        concat([
          zeroPad(hexlify(shift), 2),
          zeroPadRight(maskBytes, 15),
          zeroPadRight(valueBytes, 15),
        ])
      ) as `0x${string}`,
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

function zeroPadRight(value: Uint8Array, length: number): Uint8Array {
  const result = new Uint8Array(length)
  result.set(value, 0)
  return result
}
