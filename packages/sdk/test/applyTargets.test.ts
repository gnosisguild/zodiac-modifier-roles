import { expect } from "chai"

import { replaceTargets } from "../src/targets/applyTargets"
import { Operator, ParameterType, Target } from "../src/types"

describe("replaceTargets", () => {
  it("should revoke function-scoped targets", () => {
    const before: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.None,
              operator: Operator.Pass,
            },
          },
        ],
      },
    ]
    const after: Target[] = []

    expect(replaceTargets(before, after)).to.deep.equal([
      {
        call: "revokeFunction",
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        selector: "0x095ea7b3",
      },
    ])
  })

  it("should patch conditions", () => {
    const before: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.None,
              operator: Operator.Pass,
            },
          },
        ],
      },
    ]

    const after: Target[] = [
      {
        address: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        clearance: 2,
        executionOptions: 0,
        functions: [
          {
            selector: "0x095ea7b3",
            executionOptions: 0,
            wildcarded: false,
            condition: {
              paramType: ParameterType.None,
              operator: Operator.Or,
              children: [],
            },
          },
        ],
      },
    ]

    expect(replaceTargets(before, after)).to.deep.equal([
      {
        call: "scopeTarget",
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
      },
      {
        call: "scopeFunction",
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        selector: "0x095ea7b3",
        executionOptions: 0,
        condition: {
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [],
        },
      },
    ])
  })
})
