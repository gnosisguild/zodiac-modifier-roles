import { expect } from "chai"
import { defaultAbiCoder } from "ethers/lib/utils"

import {
  checkConditionIntegrity,
  checkRootConditionIntegrity,
} from "../src/conditions"
import { Operator, ParameterType } from "../src/types"

describe("checkRootConditionIntegrity()", () => {
  it("should throw if the root param type is not AbiEncoded", () => {
    expect(() =>
      checkRootConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          { paramType: ParameterType.Static, operator: Operator.Pass },
        ],
      })
    ).to.throw("Root param type must be `AbiEncoded`, got `Static`")
  })

  it("should throw for And without children", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [],
      })
    ).to.throw("`And` condition must have children")
  })

  it("should throw for EqualTo without compValue", () => {
    expect(() =>
      checkRootConditionIntegrity({
        paramType: ParameterType.AbiEncoded,
        operator: Operator.EqualTo,
      })
    ).to.throw("`EqualTo` condition must have a compValue")
  })

  it("should throw for And with compValue", () => {
    expect(() =>
      checkRootConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        compValue: defaultAbiCoder.encode(["uint256"], [0]),
        children: [
          { paramType: ParameterType.AbiEncoded, operator: Operator.Pass },
        ],
      })
    ).to.throw("`And` condition cannot have a compValue")
  })

  it("should throw for And with mixed children types", () => {
    expect(() =>
      checkRootConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          { paramType: ParameterType.AbiEncoded, operator: Operator.Pass },
          { paramType: ParameterType.Dynamic, operator: Operator.Pass },
        ],
      })
    ).to.throw("Inconsistent children types (`AbiEncoded` and `Dynamic`)")
  })
})
