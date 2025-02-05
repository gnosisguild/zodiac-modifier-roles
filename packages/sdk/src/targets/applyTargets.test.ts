import { expect, it, suite } from "vitest"
import { Operator, ParameterType, Target } from "zodiac-roles-deployments"
import { diffTargets } from "../diff"
import { ZeroHash } from "ethers"
import { normalizeCondition } from "../conditions"

const roleKey = ZeroHash

suite("replaceTargets", () => {
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

    const { minus, plus } = diffTargets({ roleKey, prev: before, next: after })

    expect(minus).to.deep.equal([
      {
        call: "revokeTarget",
        roleKey,
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
      },
      {
        call: "revokeFunction",
        roleKey,
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        selector: "0x095ea7b3",
      },
    ])

    expect(plus).to.deep.equal([])
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

    const { minus, plus } = diffTargets({ roleKey, prev: before, next: after })

    expect(minus).to.deep.equal([])

    expect(plus).to.deep.equal([
      {
        call: "scopeFunction",
        roleKey,
        targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
        selector: "0x095ea7b3",
        executionOptions: 0,
        condition: normalizeCondition({
          paramType: ParameterType.None,
          operator: Operator.Or,
          children: [],
        }),
      },
    ])
  })
})
