import { expect, it, suite } from "vitest"
import { Operator, ParameterType } from "zodiac-roles-deployments"

import { abiEncode } from "../../utils/abiEncode"
import { mergeConditions } from "./mergeConditions"

const DUMMY_COMP = (id: number) => ({
  paramType: ParameterType.Static,
  operator: Operator.Custom,
  compValue: abiEncode(["uint256"], [id]),
})

suite("mergeConditions()", () => {
  it("both with condition - joined via OR", () => {
    expect(mergeConditions(DUMMY_COMP(1), DUMMY_COMP(2))).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [DUMMY_COMP(1), DUMMY_COMP(2)],
    })
  })

  it("both with condition - joined via OR, left gets hoisted", () => {
    const left = {
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [DUMMY_COMP(1), DUMMY_COMP(2)],
    }

    const right = DUMMY_COMP(3)

    expect(mergeConditions(left, right)).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(3)],
    })
  })

  it("both with condition - joined via OR, right gets hoisted", () => {
    const left = DUMMY_COMP(1)

    const right = {
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [DUMMY_COMP(2), DUMMY_COMP(3)],
    }

    expect(mergeConditions(left, right)).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(3)],
    })
  })
})
