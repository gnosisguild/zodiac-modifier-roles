import { expect, it, suite } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { normalizeCondition } from "../src/conditions"
import { splitCondition } from "../src/conditions/splitCondition"
import { encodeAbiParameters } from "../src/utils/encodeAbiParameters"

const DUMMY_COMP = (id: number): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.Custom,
  compValue: encodeAbiParameters(["uint256"], [id]),
})

suite("splitCondition", () => {
  it("returns the remainder condition for ORs", () => {
    const combined = {
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [DUMMY_COMP(0), DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(3)],
    }

    // n:m split
    expect(
      splitCondition(combined, {
        paramType: ParameterType.None,
        operator: Operator.Or,
        children: [DUMMY_COMP(0), DUMMY_COMP(1)],
      })
    ).to.deep.equal(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.Or,
        children: [DUMMY_COMP(2), DUMMY_COMP(3)],
      })
    )

    // 1:n split
    expect(splitCondition(combined, DUMMY_COMP(0))).to.deep.equal(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.Or,
        children: [DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(3)],
      })
    )

    // n:1 split
    expect(
      splitCondition(combined, {
        paramType: ParameterType.None,
        operator: Operator.Or,
        children: [DUMMY_COMP(0), DUMMY_COMP(1), DUMMY_COMP(2)],
      })
    ).to.deep.equal(normalizeCondition(DUMMY_COMP(3)))
  })

  it("hoists the split through MATCHES and AND parents", () => {
    const combined = {
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [DUMMY_COMP(0), DUMMY_COMP(1)],
            },
            DUMMY_COMP(2),
          ],
        },
        DUMMY_COMP(3),
      ],
    }

    const split = {
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [DUMMY_COMP(0), DUMMY_COMP(2)],
        },
        DUMMY_COMP(3),
      ],
    }

    expect(splitCondition(combined, split)).to.deep.equal(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          {
            paramType: ParameterType.AbiEncoded,
            operator: Operator.Matches,
            children: [DUMMY_COMP(1), DUMMY_COMP(2)],
          },
          DUMMY_COMP(3),
        ],
      })
    )
  })

  it("returns `undefined` if the split condition is equal to the combined condition", () => {
    const condition = {
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [DUMMY_COMP(0), DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(3)],
    }

    expect(splitCondition(condition, condition)).to.be.undefined
  })

  it("throws if the split condition is not a sub-condition of the combined condition", () => {
    const condition = {
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [DUMMY_COMP(0), DUMMY_COMP(1)],
            },
            DUMMY_COMP(2),
          ],
        },
        DUMMY_COMP(3),
      ],
    }

    const split1 = {
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [DUMMY_COMP(999)],
            },
            DUMMY_COMP(2),
          ],
        },
        DUMMY_COMP(3),
      ],
    }
    expect(() => splitCondition(condition, split1)).to.throw(
      "inconsistent children"
    )

    const split2 = {
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [DUMMY_COMP(0), DUMMY_COMP(1)],
            },
            DUMMY_COMP(999),
          ],
        },
        DUMMY_COMP(999),
      ],
    }
    expect(() => splitCondition(condition, split2)).to.throw(
      "more than one AND branch differs"
    )

    const split3 = {
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [
        {
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [DUMMY_COMP(0)],
            },
            DUMMY_COMP(999),
          ],
        },
        DUMMY_COMP(3),
      ],
    }
    expect(() => splitCondition(condition, split3)).to.throw(
      "more than one child differs"
    )
  })
})
