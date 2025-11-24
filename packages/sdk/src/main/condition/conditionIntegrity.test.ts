import { expect, it, suite } from "vitest"
import { Encoding, Operator } from "zodiac-roles-deployments"

import { abiEncode } from "../abiEncode"
import {
  checkConditionIntegrity,
  checkRootConditionIntegrity,
} from "./conditionIntegrity"

suite("checkConditionIntegrity()", () => {
  it("should throw for And without children", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [],
      })
    ).to.throw("`And` condition must have children")
  })

  it("should throw for EqualTo without compValue", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: Encoding.Static,
        operator: Operator.EqualTo,
      })
    ).to.throw("`EqualTo` condition must have a compValue")
  })

  it("should throw for And with compValue", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: Encoding.None,
        operator: Operator.And,
        compValue: abiEncode(["uint256"], [0]),
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      })
    ).to.throw("`And` condition cannot have a compValue")
  })

  it("should throw for And with mixed children types", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Static, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      })
    ).to.throw("Inconsistent children types (`Static` and `Dynamic`)")
  })

  it("should not throw for And with Calldata and Dynamic children", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Calldata, operator: Operator.Pass },
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
        ],
      })
    ).to.not.throw()
  })

  it("should throw for And with Calldata and Dynamic children if Calldata does not come first", () => {
    expect(() =>
      checkConditionIntegrity({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [
          { paramType: Encoding.Dynamic, operator: Operator.Pass },
          { paramType: Encoding.Calldata, operator: Operator.Pass },
        ],
      })
    ).to.throw("Mixed children types: `Calldata` must appear before `Dynamic`")
  })
})

suite("checkRootConditionIntegrity()", () => {
  it("should throw if the root param type is not Calldata", () => {
    expect(() =>
      checkRootConditionIntegrity({
        paramType: Encoding.None,
        operator: Operator.And,
        children: [{ paramType: Encoding.Static, operator: Operator.Pass }],
      })
    ).to.throw("Root param type must be `Calldata`, got `Static`")
  })
})
