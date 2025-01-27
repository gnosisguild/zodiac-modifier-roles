import { expect, it, suite } from "vitest"
import { Operator, ParameterType } from "zodiac-roles-deployments"

import { normalizeCondition, stripIds } from "./normalizeCondition"
import { c, FunctionPermissionCoerced } from "../permissions"
import { allow } from "../entrypoints/kit"
import { mergeFunctionPermissions } from "../permissions/mergeFunctionPermissions"
import { encodeAbiParameters } from "../utils/encodeAbiParameters"

const DUMMY_COMP = (id: number) => ({
  paramType: ParameterType.Static,
  operator: Operator.Custom,
  compValue: encodeAbiParameters(["uint256"], [id]),
})

suite("normalizeCondition()", () => {
  it("flattens nested AND conditions", () => {
    expect(
      stripIds(
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
      )
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [DUMMY_COMP(0), DUMMY_COMP(1), DUMMY_COMP(2), DUMMY_COMP(3)],
    })
  })

  it("does not flatten ORs in ANDs", () => {
    expect(
      stripIds(
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
      )
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

  it("prunes equal branches in ANDs", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.None,
          operator: Operator.And,
          children: [DUMMY_COMP(0), DUMMY_COMP(0), DUMMY_COMP(1)],
        })
      )
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [DUMMY_COMP(0), DUMMY_COMP(1)],
    })
  })

  it("prunes nested equal branches in ANDs", () => {
    expect(
      stripIds(
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
      )
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.And,
      children: [DUMMY_COMP(0), DUMMY_COMP(1)],
    })
  })

  it("prunes single-child ANDs", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.None,
          operator: Operator.And,
          children: [DUMMY_COMP(0)],
        })
      )
    ).to.deep.equal(DUMMY_COMP(0))
  })

  it("does not prune single-child NORs", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.None,
          operator: Operator.Nor,
          children: [DUMMY_COMP(0)],
        })
      )
    ).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.Nor,
      children: [DUMMY_COMP(0)],
    })
  })

  it("prunes ANDs that become single child due to equal branch pruning", () => {
    expect(
      stripIds(
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
      )
    ).to.deep.equal(DUMMY_COMP(0))
  })

  it("enforces a canonical order for children in ANDs", () => {
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

  it("prunes trailing Static Pass nodes on Calldata", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [
            DUMMY_COMP(0),
            { paramType: ParameterType.Static, operator: Operator.Pass },
            { paramType: ParameterType.Static, operator: Operator.Pass },
          ],
        })
      )
    ).to.deep.equal({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [DUMMY_COMP(0)],
    })
  })

  it("prunes trailing Static Pass nodes on AbiEncoded", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.AbiEncoded,
          operator: Operator.Matches,
          children: [
            DUMMY_COMP(0),
            { paramType: ParameterType.Static, operator: Operator.Pass },
            { paramType: ParameterType.Static, operator: Operator.Pass },
          ],
        })
      )
    ).to.deep.equal({
      paramType: ParameterType.AbiEncoded,
      operator: Operator.Matches,
      children: [DUMMY_COMP(0)],
    })
  })

  it("prunes trailing Static Pass nodes on dynamic tuples", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.EqualToAvatar,
            },
            { paramType: ParameterType.Static, operator: Operator.Pass },
            { paramType: ParameterType.Static, operator: Operator.Pass },
          ],
        })
      )
    ).to.deep.equal({
      paramType: ParameterType.Tuple,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Dynamic,
          operator: Operator.EqualToAvatar,
        },
      ],
    })
  })

  it("prunes trailing static Tuple Pass nodes", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [
            DUMMY_COMP(0),
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Pass,
              children: [
                {
                  paramType: ParameterType.Static,
                  operator: Operator.Pass,
                },
              ],
            },
          ],
        })
      )
    ).to.deep.equal({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [DUMMY_COMP(0)],
    })
  })

  it("does not prune trailing Static Pass nodes on static tuples", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Tuple,
              operator: Operator.Matches,
              children: [
                DUMMY_COMP(0),
                { paramType: ParameterType.Static, operator: Operator.Pass },
                { paramType: ParameterType.Static, operator: Operator.Pass },
              ],
            },
            DUMMY_COMP(1),
          ],
        })
      )
    ).to.deep.equal({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [
            DUMMY_COMP(0),
            { paramType: ParameterType.Static, operator: Operator.Pass },
            { paramType: ParameterType.Static, operator: Operator.Pass },
          ],
        },
        DUMMY_COMP(1),
      ],
    })
  })

  it("prunes even dynamic trailing Pass nodes on the toplevel Matches", () => {
    expect(
      stripIds(
        normalizeCondition({
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualToAvatar,
            },
            { paramType: ParameterType.Static, operator: Operator.Pass },
            { paramType: ParameterType.Dynamic, operator: Operator.Pass },
          ],
        })
      )
    ).to.deep.equal({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Static,
          operator: Operator.EqualToAvatar,
        },
      ],
    })
  })

  it("pushes down ORs in function variants differing only in a single param scoping", () => {
    const [functionVariants] = mergeFunctionPermissions([
      allow.mainnet.lido.stETH.transfer(
        "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"
      ),
      allow.mainnet.lido.stETH.transfer(
        "0x1234123412341234123412341234123412341234"
      ),
    ])
    const { condition } = functionVariants as FunctionPermissionCoerced

    expect(stripIds(normalizeCondition(condition!))).to.deep.equal({
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [
            {
              operator: Operator.EqualTo,
              paramType: ParameterType.Static,
              compValue:
                "0x0000000000000000000000001234123412341234123412341234123412341234",
            },
            {
              operator: Operator.EqualTo,
              paramType: ParameterType.Static,
              compValue:
                "0x000000000000000000000000abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd",
            },
          ],
        },
      ],
    })
  })

  it("does not change logical operator semantics when pushing down ORs", () => {
    const [functionVariants] = mergeFunctionPermissions([
      allow.mainnet.lido.stETH.transfer(
        "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd",
        c.lt(1000)
      ),
      allow.mainnet.lido.stETH.transfer(
        "0x1234123412341234123412341234123412341234",
        c.lt(2000)
      ),
    ])
    const { condition } = functionVariants as FunctionPermissionCoerced

    expect(stripIds(normalizeCondition(condition!))).to.deep.equal({
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [
        {
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue:
                "0x0000000000000000000000001234123412341234123412341234123412341234",
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.LessThan,
              compValue:
                "0x00000000000000000000000000000000000000000000000000000000000007d0",
            },
          ],
        },
        {
          paramType: ParameterType.Calldata,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue:
                "0x000000000000000000000000abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd",
            },
            {
              paramType: ParameterType.Static,
              operator: Operator.LessThan,
              compValue:
                "0x00000000000000000000000000000000000000000000000000000000000003e8",
            },
          ],
        },
      ],
    })
  })

  it("keeps all other normalizations when pushing down ORs (idempotency is preserved)", () => {
    const [functionVariants] = mergeFunctionPermissions([
      // by using a greater number of branches we increase likelihood of differences in the normalized branch orders
      allow.mainnet.lido.stETH.transfer(
        "0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f"
      ),
      allow.mainnet.lido.stETH.transfer(
        "0x1234123412341234123412341234123412341234"
      ),
      allow.mainnet.lido.stETH.transfer(
        "0x9876987698769876987698769876987698769876"
      ),
      allow.mainnet.lido.stETH.transfer(
        "0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"
      ),
      allow.mainnet.lido.stETH.transfer(
        "0xdef1def1def1def1def1def1def1def1def1def1"
      ),
    ])
    const { condition } = functionVariants as FunctionPermissionCoerced

    const normalized = normalizeCondition(condition!)

    // assert idempotency
    expect(normalizeCondition(normalized)).to.deep.equal(normalized)
  })

  it("handles matches on arrays correctly when pushing down ORs", () => {
    const PASS = {
      paramType: ParameterType.Static,
      operator: Operator.Pass,
    }
    const condition = {
      paramType: ParameterType.None,
      operator: Operator.Or,
      children: [
        {
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          children: [DUMMY_COMP(0), PASS, DUMMY_COMP(1)],
        },
        {
          paramType: ParameterType.Array,
          operator: Operator.Matches,
          children: [DUMMY_COMP(0), PASS, PASS, DUMMY_COMP(1)],
        },
      ],
    }

    expect(stripIds(normalizeCondition(condition))).to.deep.equal(condition)
  })
})
