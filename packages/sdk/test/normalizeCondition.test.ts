import { expect } from "chai"
import { defaultAbiCoder } from "ethers/lib/utils"

import { normalizeCondition } from "../src/conditions"
import { Condition, Operator, ParameterType } from "../src/types"

const DUMMY_COMP = (id: number): Condition => ({
  paramType: ParameterType.Static,
  operator: Operator.Custom,
  compValue: defaultAbiCoder.encode(["uint256"], [id]),
})

describe("normalizeCondition()", () => {
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
      children: [DUMMY_COMP(3), DUMMY_COMP(0), DUMMY_COMP(1), DUMMY_COMP(2)],
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
        DUMMY_COMP(3),
        {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [DUMMY_COMP(0), DUMMY_COMP(1)],
        },
      ],
    })
  })

  it("should prune equal branches in ANDs", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [DUMMY_COMP(0), DUMMY_COMP(0), DUMMY_COMP(1)],
      })
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [DUMMY_COMP(0), DUMMY_COMP(1)],
    })
  })

  it("should prune nested equal branches in ANDs", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          DUMMY_COMP(0),
          {
            paramType: ParameterType.None,
            operator: Operator.And,
            children: [DUMMY_COMP(0), DUMMY_COMP(1)],
          },
          DUMMY_COMP(1),
        ],
      })
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [DUMMY_COMP(0), DUMMY_COMP(1)],
    })
  })

  it("should prune single-child ANDs", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [DUMMY_COMP(0)],
      })
    ).to.deep.equal(DUMMY_COMP(0))
  })

  it("should non prune single-child NORs", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.Nor,
        children: [DUMMY_COMP(0)],
      })
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.Nor,
      children: [DUMMY_COMP(0)],
    })
  })

  it("should prune ANDs that become single child due to equal branch pruning", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [
          DUMMY_COMP(0),
          {
            paramType: ParameterType.None,
            operator: Operator.And,
            children: [DUMMY_COMP(0)],
          },
        ],
      })
    ).to.deep.equal(DUMMY_COMP(0))
  })

  it("should enforce a canonical order for children in ANDs", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [DUMMY_COMP(0), DUMMY_COMP(1), DUMMY_COMP(2)],
      })
    ).to.deep.equal(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.And,
        children: [DUMMY_COMP(2), DUMMY_COMP(0), DUMMY_COMP(1)],
      })
    )
  })

  it("should collapse condition subtrees unnecessarily describing static tuple structures", () => {
    const compValue = defaultAbiCoder.encode(["uint256"], [123])
    expect(
      normalizeCondition({
        paramType: ParameterType.Tuple,
        operator: Operator.EqualTo,
        compValue,
        children: [
          // tuple has only static children
          { paramType: ParameterType.Static, operator: Operator.Pass },
          { paramType: ParameterType.Static, operator: Operator.Pass },
        ],
      })
    ).to.deep.equal({
      paramType: ParameterType.Static,
      operator: Operator.EqualTo,
      compValue,
    })
  })

  it("should collapse condition subtrees unnecessarily describing static array structures", () => {
    const compValue = defaultAbiCoder.encode(["uint256"], [123])
    expect(
      normalizeCondition({
        paramType: ParameterType.Array,
        operator: Operator.EqualTo,
        compValue,
        children: [
          // array children type is static
          { paramType: ParameterType.Static, operator: Operator.Pass },
        ],
      })
    ).to.deep.equal({
      paramType: ParameterType.Static,
      operator: Operator.EqualTo,
      compValue,
    })
  })

  it("should prune trailing Static Pass nodes", () => {
    expect(
      normalizeCondition({
        paramType: ParameterType.AbiEncoded,
        operator: Operator.Matches,
        children: [
          DUMMY_COMP(0),
          { paramType: ParameterType.Static, operator: Operator.Pass },
          { paramType: ParameterType.Static, operator: Operator.Pass },
        ],
      })
    ).to.deep.equal({
      paramType: ParameterType.AbiEncoded,
      operator: Operator.Matches,
      children: [DUMMY_COMP(0)],
    })
  })
})
