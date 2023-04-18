import { expect } from "chai"

import { normalizeCondition } from "../src/conditions/normalizeConditions"
import { Operator, ParameterType } from "../src/types"

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
              { paramType: ParameterType.None, operator: Operator.Pass },
            ],
          },
          { paramType: ParameterType.None, operator: Operator.Pass },
        ],
      })
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [
        { paramType: ParameterType.None, operator: Operator.Pass },
        { paramType: ParameterType.None, operator: Operator.Pass },
      ],
    })
  })
})
