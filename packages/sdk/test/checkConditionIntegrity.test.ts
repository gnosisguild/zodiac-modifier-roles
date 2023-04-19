import { expect } from "chai"

import { checkRootConditionIntegrity } from "../src/conditions"
import { Operator, ParameterType } from "../src/types"

describe.only("checkRootConditionIntegrity()", () => {
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
      checkRootConditionIntegrity({
        paramType: ParameterType.AbiEncoded,
        operator: Operator.And,
        children: [],
      })
    ).to.throw("And condition must have at least one child")
  })

  it("should throw for EqualTo without compValue", () => {
    expect(() =>
      checkRootConditionIntegrity({
        paramType: ParameterType.AbiEncoded,
        operator: Operator.EqualTo,
      })
    ).to.throw("EqualTo condition must have a compValue")
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
