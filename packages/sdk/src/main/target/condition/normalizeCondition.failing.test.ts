import { expect, it, suite } from "vitest"
import { Condition, Operator, ParameterType } from "zodiac-roles-deployments"

import { normalizeCondition, stripIds } from "./normalizeCondition"

suite("normalizeCondition()", () => {
  it.only("chaining ORs ends up with an invalid type tree", () => {
    const CompA =
      "0x000000000000000000000000000000000000000000000000000000000000000a"
    const CompB =
      "0x000000000000000000000000000000000000000000000000000000000000000b"

    const a: Condition = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: CompA,
            },
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Pass,
            },
          ],
        },
      ],
    }

    const b: Condition = {
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      children: [
        {
          paramType: ParameterType.Tuple,
          operator: Operator.Matches,
          children: [
            {
              paramType: ParameterType.Static,
              operator: Operator.EqualTo,
              compValue: CompB,
            },
            {
              paramType: ParameterType.Dynamic,
              operator: Operator.Pass,
            },
          ],
        },
      ],
    }

    // OUTPUT IS:
    // const c = {
    //   paramType: ParameterType.Calldata,
    //   operator: Operator.Matches,
    //   children: [
    //     {
    //       paramType: ParameterType.Tuple,
    //       operator: Operator.Matches,
    //       children: [
    //         { paramType: ParameterType.Dynamic, operator: Operator.Pass },
    //         {
    //           paramType: ParameterType.None,
    //           operator: Operator.Or,
    //           children: [
    //             {
    //               paramType: ParameterType.Static,
    //               operator: Operator.EqualTo,
    //               compValue:
    //                 "0x000000000000000000000000000000000000000000000000000000000000000a",
    //             },
    //             {
    //               paramType: ParameterType.Static,
    //               operator: Operator.EqualTo,
    //               compValue:
    //                 "0x000000000000000000000000000000000000000000000000000000000000000b",
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // }

    const result: Condition = stripIds(
      normalizeCondition({
        paramType: ParameterType.None,
        operator: Operator.Or,
        children: [a, b],
      })
    )

    /*
     * In this case, the optimization works by pushing the OR further down the tree.
     * That approach works, but it ends up switching the order of the tuple's types,
     * which leads to incorrect decoding (compare line 66 with what's passed in).
     */
    const [tuple] = result.children!
    expect(tuple.paramType).to.equal(ParameterType.Tuple)

    expect(tuple.children).to.have.lengthOf(2)
    const [_static, _dynamic] = tuple.children!
    expect(_static.paramType).to.equal(ParameterType.Static)
    expect(_dynamic.paramType).to.equal(ParameterType.Dynamic)
  })
})
