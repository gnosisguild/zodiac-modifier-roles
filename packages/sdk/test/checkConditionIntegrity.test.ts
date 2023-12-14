import { expect } from "chai"

import {
  checkConditionIntegrity,
  checkRootConditionIntegrity,
} from "../src/conditions"
import { Operator, ParameterType } from "../src/types"
import { encodeAbiParameters } from "../src/utils/encodeAbiParameters"

describe("checkConditionIntegrity()", () => {
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
      checkConditionIntegrity({
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
      })
    ).to.throw("`EqualTo` condition must have a compValue")
  })

  it("should throw for And with compValue", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        compValue: encodeAbiParameters(["uint256"], [0]),
        children: [
          { paramType: ParameterType.Static, operator: Operator.Pass },
        ],
      })
    ).to.throw("`And` condition cannot have a compValue")
  })

  it("should throw for And with mixed children types", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          { paramType: ParameterType.Static, operator: Operator.Pass },
          { paramType: ParameterType.Dynamic, operator: Operator.Pass },
        ],
      })
    ).to.throw("Inconsistent children types (`Static` and `Dynamic`)")
  })

  it("should not throw for And with Calldata and Dynamic children", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          { paramType: ParameterType.Calldata, operator: Operator.Pass },
          { paramType: ParameterType.Dynamic, operator: Operator.Pass },
        ],
      })
    ).to.not.throw()
  })

  it("should throw for And with Calldata and Dynamic children if Calldata does not come first", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          { paramType: ParameterType.Dynamic, operator: Operator.Pass },
          { paramType: ParameterType.Calldata, operator: Operator.Pass },
        ],
      })
    ).to.throw("Mixed children types: `Calldata` must appear before `Dynamic`")
  })
})

describe("checkRootConditionIntegrity()", () => {
  it("should throw if the root param type is not Calldata", () => {
    expect(() =>
      checkRootConditionIntegrity({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          { paramType: ParameterType.Static, operator: Operator.Pass },
        ],
      })
    ).to.throw("Root param type must be `Calldata`, got `Static`")
  })
})
