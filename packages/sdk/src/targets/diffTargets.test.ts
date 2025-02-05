import { expect, it, suite } from "vitest"
import {
  Clearance,
  ExecutionOptions,
  Operator,
  ParameterType,
  Target,
} from "zodiac-roles-deployments"
import { diffTargets } from "../diff"
import { ZeroHash } from "ethers"
import { normalizeCondition } from "../conditions"

const roleKey = ZeroHash

suite("diffTargets", () => {
  it("should correctly diff target-cleared targets", () => {
    const a: Target[] = [
      {
        address: "0x1",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
      {
        address: "0x2",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
    ]

    const b: Target[] = [
      {
        address: "0x1",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.None,
        functions: [],
      },
      {
        address: "0x2",
        clearance: Clearance.Target,
        executionOptions: ExecutionOptions.Both,
        functions: [],
      },
    ]

    expect(diffTargets({ roleKey, prev: a, next: b })).to.deep.equal({
      minus: [],
      plus: [
        {
          call: "allowTarget",
          roleKey,
          targetAddress: "0x2",
          executionOptions: ExecutionOptions.Both,
        },
      ],
    })

    expect(diffTargets({ roleKey, prev: b, next: a })).to.deep.equal({
      minus: [
        {
          call: "allowTarget",
          roleKey,
          targetAddress: "0x2",
          executionOptions: ExecutionOptions.None,
        },
      ],
      plus: [],
    })
  })

  it("should diff functions based on all their properties including conditions", () => {
    const a: Target[] = [
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

    const b: Target[] = [
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
              paramType: ParameterType.Dynamic,
              operator: Operator.EqualTo,
              compValue: "0x00",
            },
          },
        ],
      },
    ]

    //expect(diffTargets(a, a)).to.deep.equal([])
    expect(diffTargets({ roleKey, prev: a, next: a })).to.deep.equal({
      minus: [],
      plus: [],
    })

    //expect(diffTargets(a, b)).to.deep.equal(a)
    expect(diffTargets({ roleKey, prev: b, next: a })).to.deep.equal({
      minus: [],
      plus: [
        {
          call: "scopeFunction",
          roleKey,
          targetAddress: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
          selector: "0x095ea7b3",
          executionOptions: 0,
          condition: normalizeCondition({
            paramType: ParameterType.None,
            operator: Operator.Pass,
          }),
        },
      ],
    })
  })
})
