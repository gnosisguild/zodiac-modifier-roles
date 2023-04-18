import { expect } from "chai"
import { defaultAbiCoder } from "ethers/lib/utils"

import { normalizeCondition } from "../src/conditions/normalizeConditions"
import { Condition, Operator, ParameterType } from "../src/types"

const DUMMY_COMP = (id: number): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.Custom,
  compValue: defaultAbiCoder.encode(["uint256"], [id]),
})

describe.only("normalizeConditions()", () => {
  it("should flatten nested AND conditions", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          {
            paramType: ParameterType.None,
            operator: Operator.And,
            children: [
              DUMMY_COMP(0),
              {
                paramType: ParameterType.None,
                operator: Operator.And,
                children: [DUMMY_COMP(1), DUMMY_COMP(2)],
              },
            ],
          },
          DUMMY_COMP(3),
        ],
      })
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [DUMMY_COMP(0), DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(3)],
    })
  })

  it("should not flatten ORs in ANDs", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          {
            paramType: ParameterType.None,
            operator: Operator.Or,
            children: [DUMMY_COMP(0), DUMMY_COMP(1)],
          },
          DUMMY_COMP(3),
        ],
      })
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [DUMMY_COMP(0), DUMMY_COMP(1)],
        },
        DUMMY_COMP(3),
      ],
    })
  })
})
